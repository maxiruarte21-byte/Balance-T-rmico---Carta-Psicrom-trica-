import { ThermalBalanceInputs, HeatLoadBreakdown, MaterialItem } from '../types';
import { 
  ORIENTATION_SOLAR_PEAK, 
  SHADING_FACTORS, 
  OCCUPANT_METABOLIC 
} from './constants';
import { calculateSaturationVaporPressure, calculateHumidityRatio } from './psychrometrics';
import { DEFAULT_MATERIALS } from './materialsDb';

// Factor de modulación horaria de la radiación solar según la orientación y hora de diseño
function getSolarHourMultiplier(orientation: string, hour: number): number {
  const peakHourMap: Record<string, number> = {
    E: 9.5,
    NE: 9.0,
    SE: 10.0,
    S: 12.5,
    N: 12.5,
    SW: 15.0,
    W: 16.0,
    NW: 16.5,
  };

  const peak = peakHourMap[orientation] ?? 14.0;
  // Si la hora está fuera del horario solar diurno (6:00 a 20:00 hs)
  if (hour < 6 || hour > 20) return 0.05;

  const diff = Math.abs(hour - peak);
  // Campana de radiación solar suave
  const factor = Math.max(0.1, Math.exp(-Math.pow(diff / 2.8, 2)));
  return factor;
}

export function calculateHeatLoads(
  inputs: ThermalBalanceInputs, 
  materialsList: MaterialItem[] = DEFAULT_MATERIALS
): HeatLoadBreakdown {
  const { 
    mode = 'summer', 
    dimensions, 
    envelope, 
    occupancy, 
    lighting, 
    appliances, 
    simulation, 
    ventilation, 
    designConditions, 
    safetyFactor 
  } = inputs;

  // 1. Dimensiones y Superficies
  const length = Math.max(0.5, dimensions.length);
  const width = Math.max(0.5, dimensions.width);
  const height = Math.max(1.8, dimensions.height);

  const floorArea = dimensions.customArea !== undefined && dimensions.customArea > 0 
    ? dimensions.customArea 
    : length * width;

  const roomVolume = dimensions.customVolume !== undefined && dimensions.customVolume > 0 
    ? dimensions.customVolume 
    : floorArea * height;

  const perimeter = 2 * (length + width);
  const grossWallArea = perimeter * height;
  
  const windowRatio = Math.max(0.02, Math.min(0.85, envelope.windowToWallRatio));
  const windowArea = grossWallArea * windowRatio;
  const netWallArea = Math.max(0, grossWallArea - windowArea);
  const roofArea = floorArea;

  // 2. Transmitancias térmicas dinámicas desde la Base de Datos de Materiales
  const wallMat = materialsList.find(m => m.id === envelope.wallMaterialId) || materialsList.find(m => m.category === 'wall');
  const roofMat = materialsList.find(m => m.id === envelope.roofMaterialId) || materialsList.find(m => m.category === 'roof');
  const winMat = materialsList.find(m => m.id === envelope.windowMaterialId) || materialsList.find(m => m.category === 'window');

  const wallU = wallMat?.uValue ?? 1.6;
  const roofU = roofMat?.uValue ?? 0.8;
  const windowU = winMat?.uValue ?? 2.8;
  const windowShgc = winMat?.shgc ?? 0.70;

  // 3. Ventilación / Infiltración (ACH o Caudal por persona)
  let airflowM3s = 0;
  if (ventilation?.method === 'per_person') {
    const lps = ventilation.litersPerSecondPerPerson || 10;
    const people = Math.max(1, occupancy.peopleCount);
    airflowM3s = (people * lps) / 1000; // m³/s
  } else {
    const ach = Math.max(0, ventilation?.ach ?? 1.2);
    airflowM3s = (roomVolume * ach) / 3600; // m³/s
  }

  // 4. Carga por Iluminación
  let ballastFactor = 1.0;
  if (lighting?.fixtureType === 'fluorescent') ballastFactor = 1.20;
  if (lighting?.fixtureType === 'halogen') ballastFactor = 1.05;

  const lightingW = Math.max(0, (lighting?.quantity || 0) * (lighting?.wattsPerFixture || 0) * (lighting?.usageFactor || 1.0) * ballastFactor);

  const Patm = 101.325; // kPa

  if (mode === 'winter') {
    // ==========================================
    // MODO INVIERNO (CALEFACCIÓN)
    // Pérdidas térmicas hacia el exterior frío
    // ΔT = Tint - Text
    // ==========================================
    const deltaT = Math.max(0, designConditions.indoorTempC - designConditions.outdoorTempC);

    const envelopeWalls = netWallArea * wallU * deltaT;
    const envelopeRoof = roofArea * roofU * deltaT;
    const envelopeWindowsCond = windowArea * windowU * deltaT;

    const ventilationSensible = 1.20 * 1005 * airflowM3s * deltaT;
    const solarRadiation = 0;

    const people = Math.max(0, occupancy.peopleCount);
    const occupantSpecs = OCCUPANT_METABOLIC[occupancy.activityLevel] ?? OCCUPANT_METABOLIC.office;
    const occupantsSensible = people * occupantSpecs.sensibleW;
    const occupantsLatent = people * occupantSpecs.latentW;

    const appliancesTotalW = appliances.reduce((sum, item) => {
      return sum + (Math.max(0, item.quantity) * Math.max(0, item.wattsPerUnit));
    }, 0);

    const pwsOut = calculateSaturationVaporPressure(designConditions.outdoorTempC);
    const pwOut = (designConditions.outdoorRh / 100) * pwsOut;
    const wOutKg = calculateHumidityRatio(pwOut, Patm);

    const pwsIn = calculateSaturationVaporPressure(designConditions.indoorTempC);
    const pwIn = (designConditions.indoorRh / 100) * pwsIn;
    const wInKg = calculateHumidityRatio(pwIn, Patm);

    const deltaW = Math.max(0, wInKg - wOutKg);
    const hfg = 2450000;
    const ventilationLatent = 1.20 * hfg * airflowM3s * deltaW;

    const totalSensible = envelopeWalls + envelopeRoof + envelopeWindowsCond + ventilationSensible;
    const totalLatent = ventilationLatent;
    const totalLoadSubtotal = totalSensible + totalLatent;

    const safetyMargin = Math.max(0, Math.min(0.5, safetyFactor));
    const safetyMarginLoad = totalLoadSubtotal * safetyMargin;
    const totalLoadWithSafety = totalLoadSubtotal + safetyMarginLoad;

    const totalWatts = Math.round(totalLoadWithSafety);
    const totalKilowatts = +(totalWatts / 1000).toFixed(2);
    const totalFrigoriasPerHour = Math.round(totalLoadWithSafety * 0.859845); // Calorías/h
    const totalBtuPerHour = Math.round(totalLoadWithSafety * 3.412142);
    const recommendedTonsRefrigeration = +(totalBtuPerHour / 12000).toFixed(2);
    const recommendedCommercialFrigorias = Math.ceil(totalFrigoriasPerHour / 250) * 250;

    // Caudal de aire de calefacción con impulsión a ~35°C (ΔT = 35 - 21 = 14°C)
    const deltaTSupplyWinter = 14.0;
    const supplyAirflowM3s = totalSensible / (1.20 * 1005 * deltaTSupplyWinter);
    const supplyAirflowM3h = Math.round(supplyAirflowM3s * 3600);
    const supplyAirflowCfm = Math.round(supplyAirflowM3h * 0.588578);

    return {
      mode: 'winter',
      envelopeWalls: Math.round(envelopeWalls),
      envelopeRoof: Math.round(envelopeRoof),
      envelopeWindowsCond: Math.round(envelopeWindowsCond),
      solarRadiation: 0,
      occupantsSensible: Math.round(occupantsSensible),
      occupantsLatent: Math.round(occupantsLatent),
      lighting: Math.round(lightingW),
      appliances: Math.round(appliancesTotalW),
      ventilationSensible: Math.round(ventilationSensible),
      ventilationLatent: Math.round(ventilationLatent),
      totalSensible: Math.round(totalSensible),
      totalLatent: Math.round(totalLatent),
      totalLoadSubtotal: Math.round(totalLoadSubtotal),
      safetyMarginLoad: Math.round(safetyMarginLoad),
      totalLoadWithSafety: totalWatts,
      totalWatts,
      totalKilowatts,
      totalFrigoriasPerHour,
      totalBtuPerHour,
      recommendedTonsRefrigeration,
      recommendedCommercialFrigorias,
      supplyAirflowM3h,
      supplyAirflowCfm,
      sensibleHeatRatio: totalLoadSubtotal > 0 ? +(totalSensible / totalLoadSubtotal).toFixed(2) : 1.0,
    };
  } else {
    // ==========================================
    // MODO VERANO (REFRIGERACIÓN)
    // Ganancias de calor hacia el interior
    // ΔT = Text - Tint
    // ==========================================
    const deltaT = Math.max(0, designConditions.outdoorTempC - designConditions.indoorTempC);
    const roofSolAirDeltaT = deltaT + 5.0;

    const envelopeWalls = netWallArea * wallU * deltaT;
    const envelopeRoof = roofArea * roofU * roofSolAirDeltaT;
    const envelopeWindowsCond = windowArea * windowU * deltaT;

    // Radiación solar con modulación según hora pico de diseño
    const exposedWindowArea = windowArea * 0.45;
    const baseSolarPeak = ORIENTATION_SOLAR_PEAK[envelope.orientation]?.radiationW_m2 ?? 450;
    const hourMultiplier = getSolarHourMultiplier(envelope.orientation, simulation?.designHour ?? 15);
    const solarPeakAtHour = baseSolarPeak * hourMultiplier;

    const shadingFactor = SHADING_FACTORS[envelope.shading]?.factor ?? 1.0;
    const solarRadiation = exposedWindowArea * solarPeakAtHour * windowShgc * shadingFactor;

    // Ocupantes
    const people = Math.max(0, occupancy.peopleCount);
    const occupantSpecs = OCCUPANT_METABOLIC[occupancy.activityLevel] ?? OCCUPANT_METABOLIC.office;
    const occupantsSensible = people * occupantSpecs.sensibleW;
    const occupantsLatent = people * occupantSpecs.latentW;

    // Equipos
    const appliancesTotalW = appliances.reduce((sum, item) => {
      return sum + (Math.max(0, item.quantity) * Math.max(0, item.wattsPerUnit));
    }, 0);

    // Ventilación
    const ventilationSensible = 1.20 * 1005 * airflowM3s * deltaT;

    const pwsOut = calculateSaturationVaporPressure(designConditions.outdoorTempC);
    const pwOut = (designConditions.outdoorRh / 100) * pwsOut;
    const wOutKg = calculateHumidityRatio(pwOut, Patm);

    const pwsIn = calculateSaturationVaporPressure(designConditions.indoorTempC);
    const pwIn = (designConditions.indoorRh / 100) * pwsIn;
    const wInKg = calculateHumidityRatio(pwIn, Patm);

    const deltaW = Math.max(0, wOutKg - wInKg);
    const hfg = 2450000;
    const ventilationLatent = 1.20 * hfg * airflowM3s * deltaW;

    const totalSensible = envelopeWalls + envelopeRoof + envelopeWindowsCond + solarRadiation + occupantsSensible + lightingW + appliancesTotalW + ventilationSensible;
    const totalLatent = occupantsLatent + ventilationLatent;
    const totalLoadSubtotal = totalSensible + totalLatent;

    const safetyMargin = Math.max(0, Math.min(0.5, safetyFactor));
    const safetyMarginLoad = totalLoadSubtotal * safetyMargin;
    const totalLoadWithSafety = totalLoadSubtotal + safetyMarginLoad;

    const totalWatts = Math.round(totalLoadWithSafety);
    const totalKilowatts = +(totalWatts / 1000).toFixed(2);
    const totalFrigoriasPerHour = Math.round(totalLoadWithSafety * 0.859845);
    const totalBtuPerHour = Math.round(totalLoadWithSafety * 3.412142);
    const recommendedTonsRefrigeration = +(totalBtuPerHour / 12000).toFixed(2);
    const recommendedCommercialFrigorias = Math.ceil(totalFrigoriasPerHour / 250) * 250;

    // Caudal de aire de refrigeración con impulsión a 12.5°C (ΔT = 23 - 12.5 = 10.5°C)
    const deltaTSupplySummer = 10.5;
    const supplyAirflowM3s = totalSensible / (1.20 * 1005 * deltaTSupplySummer);
    const supplyAirflowM3h = Math.round(supplyAirflowM3s * 3600);
    const supplyAirflowCfm = Math.round(supplyAirflowM3h * 0.588578);

    return {
      mode: 'summer',
      envelopeWalls: Math.round(envelopeWalls),
      envelopeRoof: Math.round(envelopeRoof),
      envelopeWindowsCond: Math.round(envelopeWindowsCond),
      solarRadiation: Math.round(solarRadiation),
      occupantsSensible: Math.round(occupantsSensible),
      occupantsLatent: Math.round(occupantsLatent),
      lighting: Math.round(lightingW),
      appliances: Math.round(appliancesTotalW),
      ventilationSensible: Math.round(ventilationSensible),
      ventilationLatent: Math.round(ventilationLatent),
      totalSensible: Math.round(totalSensible),
      totalLatent: Math.round(totalLatent),
      totalLoadSubtotal: Math.round(totalLoadSubtotal),
      safetyMarginLoad: Math.round(safetyMarginLoad),
      totalLoadWithSafety: totalWatts,
      totalWatts,
      totalKilowatts,
      totalFrigoriasPerHour,
      totalBtuPerHour,
      recommendedTonsRefrigeration,
      recommendedCommercialFrigorias,
      supplyAirflowM3h,
      supplyAirflowCfm,
      sensibleHeatRatio: totalLoadSubtotal > 0 ? +(totalSensible / totalLoadSubtotal).toFixed(2) : 1.0,
    };
  }
}
