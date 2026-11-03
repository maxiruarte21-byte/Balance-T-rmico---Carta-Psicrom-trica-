export type CalculationMode = 'summer' | 'winter';

export type FacilityType = 
  | 'residential' 
  | 'office' 
  | 'commercial_kiosk' 
  | 'auditorium' 
  | 'restaurant' 
  | 'fitness_gym';

export type ActivityLevel = 'resting' | 'office' | 'moderate' | 'high';

export type Orientation = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export type ShadingType = 'none' | 'internal_blinds' | 'external_overhang' | 'solar_tinted';

export interface ApplianceItem {
  id: string;
  name: string;
  quantity: number;
  wattsPerUnit: number;
  category: 'refrigeration' | 'computing' | 'kitchen' | 'lighting' | 'custom';
}

export interface MaterialItem {
  id: string;
  name: string;
  category: 'wall' | 'roof' | 'window';
  uValue: number; // W/(m²·K)
  shgc?: number; // Para vidrios (Solar Heat Gain Coefficient)
  standard: string; // ej. IRAM 11605 / ASHRAE 90.1
  desc: string;
  isCustom?: boolean;
}

export interface LightingInput {
  fixtureType: 'led' | 'fluorescent' | 'halogen';
  quantity: number;
  wattsPerFixture: number;
  usageFactor: number; // 0.8 a 1.0
}

export interface ThermalBalanceInputs {
  mode: CalculationMode; // 'summer' (refrigeración) | 'winter' (calefacción)
  facilityType: FacilityType;
  dimensions: {
    length: number; // metros
    width: number;  // metros
    height: number; // metros
    customArea?: number; // m² (opcional)
    customVolume?: number; // m³ (opcional)
  };
  envelope: {
    wallMaterialId: string;
    roofMaterialId: string;
    windowMaterialId: string;
    windowToWallRatio: number; // 0.05 a 0.80
    orientation: Orientation;
    shading: ShadingType;
  };
  occupancy: {
    peopleCount: number;
    activityLevel: ActivityLevel;
  };
  lighting: LightingInput;
  appliances: ApplianceItem[];
  simulation: {
    designHour: number; // 8 a 20 hs (hora pico para radiación solar)
  };
  ventilation: {
    method: 'ach' | 'per_person'; // renovaciones/hora o caudal por persona
    ach: number; // renovaciones por hora
    litersPerSecondPerPerson: number; // L/s por persona (ej: 10 L/s según ASHRAE 62.1)
  };
  designConditions: {
    outdoorTempC: number;
    outdoorRh: number; // %
    indoorTempC: number;
    indoorRh: number; // %
  };
  safetyFactor: number; // ej. 0.10 (10%) o 0.15 (15%)
}

export interface HeatLoadBreakdown {
  mode: CalculationMode;
  envelopeWalls: number; // W
  envelopeRoof: number;  // W
  envelopeWindowsCond: number; // W
  solarRadiation: number; // W (solo en refrigeración diurna)
  occupantsSensible: number; // W
  occupantsLatent: number; // W
  lighting: number; // W
  appliances: number; // W
  ventilationSensible: number; // W
  ventilationLatent: number; // W
  
  totalSensible: number; // W
  totalLatent: number; // W
  totalLoadSubtotal: number; // W
  safetyMarginLoad: number; // W
  totalLoadWithSafety: number; // W

  // Unidades de climatización simultáneas
  totalWatts: number;
  totalKilowatts: number;
  totalFrigoriasPerHour: number; // Frigorías/h o Calorías/h
  totalBtuPerHour: number;
  recommendedTonsRefrigeration: number;
  recommendedCommercialFrigorias: number;

  // Caudal de aire volumétrico de suministro
  supplyAirflowM3h: number; // m³/h
  supplyAirflowCfm: number; // CFM (Cubic Feet per Minute)

  sensibleHeatRatio: number; // SHR = Sensible / Total
}

export interface PsychrometricState {
  dryBulbTempC: number;
  relativeHumidity: number; // %
  pressureKPa: number; // kPa (default 101.325)
  altitudeMeters: number;

  saturationVaporPressureKPa: number; // Pws
  vaporPressureKPa: number; // Pw
  humidityRatioKgKg: number; // W en kg/kg
  humidityRatioGKg: number; // w en g/kg
  dewPointTempC: number; // Tpr (°C)
  wetBulbTempC: number; // Tbh (°C)
  specificEnthalpyKjKg: number; // h (kJ/kg)
  specificVolumeM3Kg: number; // v (m³/kg)
  densityKgM3: number; // rho (kg/m³)
  comfortAssessment: ComfortStatus;
  comfortTitle: string;
  comfortAdvice: string;
}

export type ComfortStatus = 
  | 'comfort_optimal' 
  | 'too_warm_humid' 
  | 'too_warm_dry' 
  | 'too_cold_humid' 
  | 'too_cold_dry' 
  | 'high_humidity_risk' 
  | 'low_humidity_dry';
