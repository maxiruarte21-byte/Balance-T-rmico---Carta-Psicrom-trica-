import { PsychrometricState, ComfortStatus } from '../types';

/**
 * Calculates atmospheric pressure (kPa) given altitude in meters
 * International Standard Atmosphere (ISA) formula
 */
export function altitudeToPressureKPa(altitudeMeters: number): number {
  if (altitudeMeters <= 0) return 101.325;
  const p = 101.325 * Math.pow(1 - 2.25577e-5 * altitudeMeters, 5.25588);
  return Math.max(30, Math.min(110, p));
}

/**
 * Calculates saturation vapor pressure Pws (kPa) for a given dry-bulb temp (°C)
 * Standard Tetens/ASHRAE formulation
 */
export function calculateSaturationVaporPressure(tempC: number): number {
  if (tempC >= 0) {
    return 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  } else {
    return 0.61078 * Math.exp((21.875 * tempC) / (tempC + 265.5));
  }
}

/**
 * Calculates humidity ratio W (kg water vapor / kg dry air)
 * Pw in kPa, Patm in kPa
 */
export function calculateHumidityRatio(vaporPressureKPa: number, pressureKPa: number): number {
  if (vaporPressureKPa >= pressureKPa) return 0.05; // limit singularity
  const w = 0.62198 * (vaporPressureKPa / (pressureKPa - vaporPressureKPa));
  return Math.max(0, w);
}

/**
 * Calculates Dew Point Temperature (°C) from vapor pressure (kPa)
 */
export function calculateDewPoint(vaporPressureKPa: number): number {
  const clampedPw = Math.max(0.01, vaporPressureKPa);
  const alpha = Math.log(clampedPw / 0.61078);
  const tdp = (237.3 * alpha) / (17.27 - alpha);
  return tdp;
}

/**
 * Calculates Wet Bulb Temperature (°C) using psychrometric energy balance bisection
 * Accurate across standard HVAC range (-10°C to 55°C)
 */
export function calculateWetBulb(
  dryBulbTempC: number, 
  humidityRatioKgKg: number, 
  pressureKPa: number
): number {
  // Target humidity ratio W
  const wTarget = humidityRatioKgKg;

  // Bisection search bounds: Twb is between Dew Point and Dry Bulb
  const tdp = calculateDewPoint(calculateSaturationVaporPressure(dryBulbTempC) * 0.1);
  let low = Math.min(tdp - 2, dryBulbTempC - 25);
  let high = dryBulbTempC;

  for (let iter = 0; iter < 30; iter++) {
    const mid = (low + high) / 2;
    const pwsMid = calculateSaturationVaporPressure(mid);
    const wsMid = calculateHumidityRatio(pwsMid, pressureKPa);

    // Psychrometric equation for Twb:
    // W = ((2501 - 2.326 * Twb) * Ws - 1.006 * (T - Twb)) / (2501 + 1.86 * T - 4.186 * Twb)
    const numerator = (2501 - 2.326 * mid) * wsMid - 1.006 * (dryBulbTempC - mid);
    const denominator = 2501 + 1.86 * dryBulbTempC - 4.186 * mid;
    const wCalc = numerator / denominator;

    if (Math.abs(wCalc - wTarget) < 1e-6) {
      return mid;
    }

    if (wCalc > wTarget) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return (low + high) / 2;
}

/**
 * Calculates specific enthalpy h (kJ/kg dry air)
 */
export function calculateEnthalpy(dryBulbTempC: number, humidityRatioKgKg: number): number {
  return 1.006 * dryBulbTempC + humidityRatioKgKg * (2501 + 1.86 * dryBulbTempC);
}

/**
 * Calculates specific volume v (m³ / kg dry air)
 */
export function calculateSpecificVolume(
  dryBulbTempC: number, 
  humidityRatioKgKg: number, 
  pressureKPa: number
): number {
  const Ra = 0.287058; // kJ/(kg·K)
  const Tkelvin = dryBulbTempC + 273.15;
  return (Ra * Tkelvin * (1 + 1.6078 * humidityRatioKgKg)) / pressureKPa;
}

/**
 * Evaluates thermal comfort status according to ASHRAE Standard 55
 */
export function assessComfort(dryBulbC: number, rhPercent: number, dewPointC: number): {
  status: ComfortStatus;
  title: string;
  advice: string;
} {
  // Parámetros de confort según la norma ASHRAE 55 (vestimenta 0.5 a 1.0 clo, actividad 1.1 met)
  // Verano: ~23°C a 26°C, Invierno: ~20°C a 24°C
  // Humedad relativa recomendada: entre 30% y 60% (Punto de rocío entre 2.0°C y 16.8°C)
  const isTempComfortable = dryBulbC >= 20.0 && dryBulbC <= 26.0;
  const isRhComfortable = rhPercent >= 30.0 && rhPercent <= 60.0;
  const isDewPointComfortable = dewPointC <= 16.8 && dewPointC >= 2.0;

  if (isTempComfortable && isRhComfortable && isDewPointComfortable) {
    return {
      status: 'comfort_optimal',
      title: 'En Zona de Confort Óptima (ASHRAE 55)',
      advice: 'Sensación térmica neutral. La combinación de temperatura y humedad garantiza el máximo bienestar psicrométrico sin estrés térmico para los ocupantes.',
    };
  }

  if (dryBulbC > 26.0 && rhPercent > 60.0) {
    return {
      status: 'too_warm_humid',
      title: 'Ambiente Muy Caluroso y Húmedo',
      advice: 'Sensación de bochorno e incomodidad por sudoración. Requiere enfriamiento y deshumidificación activa mediante batería de frío a baja temperatura de evaporación.',
    };
  }

  if (dryBulbC > 26.0 && rhPercent <= 60.0) {
    return {
      status: 'too_warm_dry',
      title: 'Ambiente Caluroso y Seco',
      advice: 'Temperatura elevada con baja humedad. Se requiere refrigeración sensible. En climas muy secos, el enfriamiento evaporativo directo/indirecto es muy eficiente.',
    };
  }

  if (dryBulbC < 20.0 && rhPercent > 60.0) {
    return {
      status: 'too_cold_humid',
      title: 'Ambiente Frío y Húmedo',
      advice: 'Sensación de frío húmedo penetrante. La calefacción del recinto elevará la temperatura y bajará la humedad relativa de forma natural hasta la zona de confort.',
    };
  }

  if (dryBulbC < 20.0 && rhPercent < 30.0) {
    return {
      status: 'too_cold_dry',
      title: 'Ambiente Frío y Seco',
      advice: 'Condiciones de frío árido. Requiere calefacción y es aconsejable humidificación (de vapor o adiabática) para evitar irritación respiratoria y cargas electrostáticas.',
    };
  }

  if (rhPercent > 65.0 || dewPointC > 17.5) {
    return {
      status: 'high_humidity_risk',
      title: 'Alto Riesgo de Humedad y Moho',
      advice: 'Humedad relativa excesiva. Existe riesgo de condensaciones superficiales y proliferación de hongos o ácaros. Requiere ciclo de deshumidificación con recalentamiento.',
    };
  }

  if (rhPercent < 30.0) {
    return {
      status: 'low_humidity_dry',
      title: 'Ambiente Muy Seco / Baja Humedad',
      advice: 'El aire seco puede provocar sequedad ocular, irritación en garganta y polvo en suspensión. Se sugiere humidificación del aire de suministro.',
    };
  }

  return {
    status: 'comfort_optimal',
    title: 'Cercano a la Zona de Confort',
    advice: 'Parámetros cercanos a los límites de confort. Ajustes menores en el termostato permitirán alcanzar la neutralidad térmica óptima.',
  };
}

/**
 * Calcula el estado psicrométrico completo
 */
export function computePsychrometricState(
  dryBulbTempC: number,
  relativeHumidity: number,
  pressureKPa: number,
  altitudeMeters: number
): PsychrometricState {
  const pws = calculateSaturationVaporPressure(dryBulbTempC);
  const rhRatio = Math.max(0.01, Math.min(100, relativeHumidity)) / 100;
  const pw = rhRatio * pws;
  const w = calculateHumidityRatio(pw, pressureKPa);
  const wGKg = w * 1000;
  const tdp = calculateDewPoint(pw);
  const twb = calculateWetBulb(dryBulbTempC, w, pressureKPa);
  const h = calculateEnthalpy(dryBulbTempC, w);
  const v = calculateSpecificVolume(dryBulbTempC, w, pressureKPa);
  const density = (1 + w) / v;
  const comfort = assessComfort(dryBulbTempC, relativeHumidity, tdp);

  return {
    dryBulbTempC,
    relativeHumidity,
    pressureKPa,
    altitudeMeters,
    saturationVaporPressureKPa: pws,
    vaporPressureKPa: pw,
    humidityRatioKgKg: w,
    humidityRatioGKg: wGKg,
    dewPointTempC: tdp,
    wetBulbTempC: twb,
    specificEnthalpyKjKg: h,
    specificVolumeM3Kg: v,
    densityKgM3: density,
    comfortAssessment: comfort.status,
    comfortTitle: comfort.title,
    comfortAdvice: comfort.advice,
  };
}

/**
 * Calculates humidity ratio W (in g/kg) for given dry-bulb temp (°C) and RH (%) at given pressure (kPa)
 * Used to draw RH curves on psychrometric chart
 */
export function getWFromTempAndRh(tempC: number, rhPercent: number, pressureKPa: number): number {
  const pws = calculateSaturationVaporPressure(tempC);
  const pw = (rhPercent / 100) * pws;
  return calculateHumidityRatio(pw, pressureKPa) * 1000; // in g/kg
}

/**
 * Returns dry-bulb temperature (°C) for a given wet-bulb line at a specific humidity ratio
 */
export function getTempFromWetBulbAndW(twb: number, wGKg: number, pressureKPa: number): number {
  const w = wGKg / 1000;
  const pwsTwb = calculateSaturationVaporPressure(twb);
  const wsTwb = calculateHumidityRatio(pwsTwb, pressureKPa);
  
  // W = ((2501 - 2.326*Twb)*ws - 1.006*(T - Twb)) / (2501 + 1.86*T - 4.186*Twb)
  // Rearranging for T:
  // W * (2501 - 4.186*Twb) + W * 1.86*T = (2501 - 2.326*Twb)*ws - 1.006*T + 1.006*Twb
  // T * (1.006 + 1.86*W) = (2501 - 2.326*Twb)*ws + 1.006*Twb - W * (2501 - 4.186*Twb)
  const numerator = (2501 - 2.326 * twb) * wsTwb + 1.006 * twb - w * (2501 - 4.186 * twb);
  const denominator = 1.006 + 1.86 * w;
  return numerator / denominator;
}
