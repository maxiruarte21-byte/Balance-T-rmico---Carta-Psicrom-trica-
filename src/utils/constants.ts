import { 
  FacilityType, 
  Orientation, 
  ShadingType, 
  ActivityLevel,
  ApplianceItem,
  ThermalBalanceInputs 
} from '../types';

// Radiación solar máxima sobre superficie vertical (W/m²) en verano
export const ORIENTATION_SOLAR_PEAK: Record<Orientation, { label: string; radiationW_m2: number; solarHour: string }> = {
  N: { label: 'Norte (Sol directo en H. Sur / Difuso en H. Norte)', radiationW_m2: 450, solarHour: 'Máximo 11:00 - 13:00' },
  NE: { label: 'Noreste (Sol de la mañana)', radiationW_m2: 420, solarHour: 'Máximo 08:00 - 10:00' },
  E: { label: 'Este (Sol matutino intenso)', radiationW_m2: 580, solarHour: 'Máximo 08:30 - 11:00' },
  SE: { label: 'Sureste', radiationW_m2: 380, solarHour: 'Máximo 07:00 - 09:30' },
  S: { label: 'Sur (Sombra predominante en H. Sur / Sol en H. Norte)', radiationW_m2: 130, solarHour: 'Radiación difusa' },
  SW: { label: 'Suroeste', radiationW_m2: 400, solarHour: 'Máximo 14:00 - 16:30' },
  W: { label: 'Oeste (Sol vespertino muy caluroso y penetrante)', radiationW_m2: 630, solarHour: 'Máximo 15:30 - 18:30' },
  NW: { label: 'Noroeste (Tarde calurosa)', radiationW_m2: 520, solarHour: 'Máximo 14:30 - 17:30' },
};

export const SHADING_FACTORS: Record<ShadingType, { label: string; factor: number }> = {
  none: { label: 'Sin Protección Solar (Exposición Directa)', factor: 1.0 },
  internal_blinds: { label: 'Cortinas o Persianas Interiores Claras', factor: 0.65 },
  external_overhang: { label: 'Aleros Exteriores / Toldo / Parasoles', factor: 0.35 },
  solar_tinted: { label: 'Lámina Polarizada / Vidrio Tonalizado', factor: 0.45 },
};

export const OCCUPANT_METABOLIC: Record<ActivityLevel, { label: string; sensibleW: number; latentW: number; totalW: number }> = {
  resting: {
    label: 'Reposo / Sentado (Vivienda, Cine, Auditorio)',
    sensibleW: 70,
    latentW: 45,
    totalW: 115,
  },
  office: {
    label: 'Trabajo de Oficina / Actividad Ligera (Escritura, De pie)',
    sensibleW: 75,
    latentW: 65,
    totalW: 140,
  },
  moderate: {
    label: 'Actividad Moderada (Comercio, Clientes en Kiosco/Local)',
    sensibleW: 85,
    latentW: 90,
    totalW: 175,
  },
  high: {
    label: 'Actividad Intensa (Gimnasio, Trabajo Físico Fuerte)',
    sensibleW: 120,
    latentW: 180,
    totalW: 300,
  },
};

export const APPLIANCE_PRESETS: Omit<ApplianceItem, 'id'>[] = [
  {
    name: 'Heladera Exhibidora Comercial con Puerta Vidriada',
    quantity: 1,
    wattsPerUnit: 800,
    category: 'refrigeration',
  },
  {
    name: 'Heladera Batea / Exhibidor de Bebidas Abierto',
    quantity: 1,
    wattsPerUnit: 1200,
    category: 'refrigeration',
  },
  {
    name: 'Freezer de Helados Comercial / Pozo de Frío',
    quantity: 1,
    wattsPerUnit: 650,
    category: 'refrigeration',
  },
  {
    name: 'Computadora de Escritorio PC + Monitores',
    quantity: 1,
    wattsPerUnit: 220,
    category: 'computing',
  },
  {
    name: 'Notebook / Computadora Portátil',
    quantity: 1,
    wattsPerUnit: 65,
    category: 'computing',
  },
  {
    name: 'Rack de Servidores / Routers y Conectividad',
    quantity: 1,
    wattsPerUnit: 850,
    category: 'computing',
  },
  {
    name: 'Cafetera Espresso Comercial (2 Grupos)',
    quantity: 1,
    wattsPerUnit: 1800,
    category: 'kitchen',
  },
  {
    name: 'Horno Microondas Comercial / Tostadora',
    quantity: 1,
    wattsPerUnit: 950,
    category: 'kitchen',
  },
  {
    name: 'Pantalla de TV / Cartelería Digital (55" a 65")',
    quantity: 1,
    wattsPerUnit: 140,
    category: 'custom',
  },
  {
    name: 'Luminaria Dicroica Tradicional (Halógena)',
    quantity: 1,
    wattsPerUnit: 50,
    category: 'lighting',
  },
  {
    name: 'Panel / Luminaria LED Eficiente',
    quantity: 1,
    wattsPerUnit: 18,
    category: 'lighting',
  },
];

export const FACILITY_DEFAULTS: Record<FacilityType, Partial<ThermalBalanceInputs>> = {
  commercial_kiosk: {
    dimensions: { length: 6, width: 4, height: 3.0 },
    envelope: {
      wallMaterialId: 'wall_sandwich_pur_80',
      roofMaterialId: 'roof_metal_sandwich_pur',
      windowMaterialId: 'window_single_clear',
      windowToWallRatio: 0.35,
      orientation: 'W',
      shading: 'none',
    },
    occupancy: {
      peopleCount: 4,
      activityLevel: 'moderate',
    },
    lighting: {
      fixtureType: 'led',
      quantity: 8,
      wattsPerFixture: 25,
      usageFactor: 0.9,
    },
    ventilation: {
      method: 'ach',
      ach: 1.5,
      litersPerSecondPerPerson: 10,
    },
    designConditions: {
      outdoorTempC: 36,
      outdoorRh: 45,
      indoorTempC: 23,
      indoorRh: 50,
    },
    appliances: [
      { id: 'k1', name: 'Heladera Exhibidora Comercial', quantity: 8, wattsPerUnit: 800, category: 'refrigeration' },
      { id: 'k2', name: 'Freezer de Helados / Pozo', quantity: 2, wattsPerUnit: 600, category: 'refrigeration' },
      { id: 'k3', name: 'Terminal Punto de Venta (POS)', quantity: 2, wattsPerUnit: 120, category: 'computing' },
      { id: 'k4', name: 'Cafetera Espresso Comercial', quantity: 1, wattsPerUnit: 1500, category: 'kitchen' },
      { id: 'k5', name: 'Iluminación Marquesina y Salón', quantity: 1, wattsPerUnit: 350, category: 'lighting' },
    ],
    safetyFactor: 0.15,
  },
  residential: {
    dimensions: { length: 5, width: 4, height: 2.7 },
    envelope: {
      wallMaterialId: 'wall_cavity_eps',
      roofMaterialId: 'roof_concrete_xps',
      windowMaterialId: 'window_double_air',
      windowToWallRatio: 0.18,
      orientation: 'W',
      shading: 'internal_blinds',
    },
    occupancy: {
      peopleCount: 3,
      activityLevel: 'resting',
    },
    lighting: {
      fixtureType: 'led',
      quantity: 6,
      wattsPerFixture: 15,
      usageFactor: 0.8,
    },
    ventilation: {
      method: 'ach',
      ach: 0.8,
      litersPerSecondPerPerson: 8,
    },
    designConditions: {
      outdoorTempC: 34,
      outdoorRh: 50,
      indoorTempC: 24,
      indoorRh: 50,
    },
    appliances: [
      { id: 'r1', name: 'Heladera Familiar No-Frost', quantity: 1, wattsPerUnit: 180, category: 'refrigeration' },
      { id: 'r2', name: 'Smart TV 55"', quantity: 1, wattsPerUnit: 110, category: 'custom' },
      { id: 'r3', name: 'Computadora / Iluminación', quantity: 2, wattsPerUnit: 75, category: 'computing' },
    ],
    safetyFactor: 0.10,
  },
  office: {
    dimensions: { length: 10, width: 8, height: 3.0 },
    envelope: {
      wallMaterialId: 'wall_cavity_eps',
      roofMaterialId: 'roof_concrete_xps',
      windowMaterialId: 'window_double_low_e',
      windowToWallRatio: 0.25,
      orientation: 'S',
      shading: 'internal_blinds',
    },
    occupancy: {
      peopleCount: 12,
      activityLevel: 'office',
    },
    lighting: {
      fixtureType: 'led',
      quantity: 16,
      wattsPerFixture: 36,
      usageFactor: 0.95,
    },
    ventilation: {
      method: 'ach',
      ach: 1.2,
      litersPerSecondPerPerson: 10,
    },
    designConditions: {
      outdoorTempC: 35,
      outdoorRh: 45,
      indoorTempC: 23.5,
      indoorRh: 50,
    },
    appliances: [
      { id: 'o1', name: 'Puestos de Trabajo (PC + Pantalla)', quantity: 12, wattsPerUnit: 200, category: 'computing' },
      { id: 'o2', name: 'Rack de Red y Conectividad', quantity: 1, wattsPerUnit: 600, category: 'computing' },
      { id: 'o3', name: 'Cafetera de Oficina', quantity: 1, wattsPerUnit: 1200, category: 'kitchen' },
    ],
    safetyFactor: 0.10,
  },
  auditorium: {
    dimensions: { length: 20, width: 14, height: 5.5 },
    envelope: {
      wallMaterialId: 'wall_concrete_20',
      roofMaterialId: 'roof_concrete_xps',
      windowMaterialId: 'window_double_air',
      windowToWallRatio: 0.05,
      orientation: 'N',
      shading: 'internal_blinds',
    },
    occupancy: {
      peopleCount: 80,
      activityLevel: 'resting',
    },
    lighting: {
      fixtureType: 'led',
      quantity: 24,
      wattsPerFixture: 45,
      usageFactor: 0.9,
    },
    ventilation: {
      method: 'ach',
      ach: 2.0,
      litersPerSecondPerPerson: 12,
    },
    designConditions: {
      outdoorTempC: 34,
      outdoorRh: 50,
      indoorTempC: 23,
      indoorRh: 50,
    },
    appliances: [
      { id: 'a1', name: 'Equipamiento Audiovisual y Proyector', quantity: 1, wattsPerUnit: 2800, category: 'custom' },
    ],
    safetyFactor: 0.12,
  },
  restaurant: {
    dimensions: { length: 12, width: 8, height: 3.2 },
    envelope: {
      wallMaterialId: 'wall_cavity_eps',
      roofMaterialId: 'roof_suspended_attic',
      windowMaterialId: 'window_double_air',
      windowToWallRatio: 0.30,
      orientation: 'W',
      shading: 'external_overhang',
    },
    occupancy: {
      peopleCount: 35,
      activityLevel: 'moderate',
    },
    lighting: {
      fixtureType: 'led',
      quantity: 18,
      wattsPerFixture: 25,
      usageFactor: 0.9,
    },
    ventilation: {
      method: 'ach',
      ach: 2.5,
      litersPerSecondPerPerson: 12,
    },
    designConditions: {
      outdoorTempC: 35,
      outdoorRh: 50,
      indoorTempC: 23,
      indoorRh: 50,
    },
    appliances: [
      { id: 'rest1', name: 'Exhibidoras de Bebidas', quantity: 3, wattsPerUnit: 800, category: 'refrigeration' },
      { id: 'rest2', name: 'Cafetera Espresso Doble', quantity: 1, wattsPerUnit: 2200, category: 'kitchen' },
      { id: 'rest3', name: 'Mantenedores de Platos Calientes', quantity: 1, wattsPerUnit: 1400, category: 'kitchen' },
    ],
    safetyFactor: 0.15,
  },
  fitness_gym: {
    dimensions: { length: 15, width: 10, height: 3.5 },
    envelope: {
      wallMaterialId: 'wall_concrete_20',
      roofMaterialId: 'roof_metal_sandwich_pur',
      windowMaterialId: 'window_double_air',
      windowToWallRatio: 0.25,
      orientation: 'E',
      shading: 'solar_tinted',
    },
    occupancy: {
      peopleCount: 25,
      activityLevel: 'high',
    },
    lighting: {
      fixtureType: 'led',
      quantity: 14,
      wattsPerFixture: 40,
      usageFactor: 0.9,
    },
    ventilation: {
      method: 'ach',
      ach: 2.5,
      litersPerSecondPerPerson: 15,
    },
    designConditions: {
      outdoorTempC: 33,
      outdoorRh: 55,
      indoorTempC: 21,
      indoorRh: 50,
    },
    appliances: [
      { id: 'g1', name: 'Cintas y Máquinas Cardio', quantity: 10, wattsPerUnit: 150, category: 'custom' },
      { id: 'g2', name: 'Sonido y Televisores', quantity: 4, wattsPerUnit: 120, category: 'custom' },
      { id: 'g3', name: 'Exhibidor de Bebidas Isotónicas', quantity: 1, wattsPerUnit: 750, category: 'refrigeration' },
    ],
    safetyFactor: 0.15,
  },
};
