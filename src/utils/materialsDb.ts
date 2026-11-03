import { MaterialItem } from '../types';

export const DEFAULT_MATERIALS: MaterialItem[] = [
  // MUROS (Paredes)
  {
    id: 'wall_brick_uninsulated',
    name: 'Muro de Ladrillo Común Macizo (20 cm) sin aislación',
    category: 'wall',
    uValue: 2.30,
    standard: 'IRAM 11605 (Nivel C)',
    desc: 'Ladrillo común de 20cm con revoques tradicionales, común en edificaciones antiguas sin aislante.',
  },
  {
    id: 'wall_brick_hollow_12',
    name: 'Ladrillo Hueco Cerámico (12 cm) con revoque',
    category: 'wall',
    uValue: 1.95,
    standard: 'IRAM 11605',
    desc: 'Cerámico hueco de 6 tubos para tabiquería exterior estándar.',
  },
  {
    id: 'wall_brick_hollow_18',
    name: 'Ladrillo Hueco Cerámico (18 cm) con revoque',
    category: 'wall',
    uValue: 1.60,
    standard: 'IRAM 11605',
    desc: 'Muro exterior común en viviendas urbanas.',
  },
  {
    id: 'wall_concrete_20',
    name: 'Hormigón Armado Visto (20 cm)',
    category: 'wall',
    uValue: 2.80,
    standard: 'ASHRAE 90.1',
    desc: 'Estructura pesada de hormigón sin puente térmico ni aislación adicional.',
  },
  {
    id: 'wall_cavity_eps',
    name: 'Muro Doble con Cámara y EPS/Lana de Roca (50 mm)',
    category: 'wall',
    uValue: 0.55,
    standard: 'IRAM 11605 (Nivel A)',
    desc: 'Doble pared de ladrillo con alma aislante central de alta eficiencia.',
  },
  {
    id: 'wall_drywall_rockwool',
    name: 'Tabique Durlock con Lana de Vidrio (100 mm)',
    category: 'wall',
    uValue: 0.38,
    standard: 'IRAM 11605 / ASHRAE',
    desc: 'Construcción en seco con perfilería de acero y aislante acústico-térmico de 100mm.',
  },
  {
    id: 'wall_sandwich_pur_80',
    name: 'Panel Sándwich de Chapa con PUR / PIR (80 mm)',
    category: 'wall',
    uValue: 0.28,
    standard: 'Norma Frigorífica ISO',
    desc: 'Poliuretano inyectado de alta densidad para kioscos, módulos comerciales y cámaras de frío.',
  },
  {
    id: 'wall_retak_hcca',
    name: 'Bloques de Hormigón Celular Curado en Autoclave (15 cm)',
    category: 'wall',
    uValue: 0.65,
    standard: 'IRAM 11605 (Nivel B)',
    desc: 'Bloque celular tipo Retak con microburbujas de aire estanco de baja transmitancia.',
  },

  // TECHOS Y CUBIERTAS
  {
    id: 'roof_concrete_uninsulated',
    name: 'Losa Plana de Hormigón Armado (Sin aislar)',
    category: 'roof',
    uValue: 2.50,
    standard: 'IRAM 11605',
    desc: 'Losa tradicional de 15cm sin aislante térmico superior, acumula gran calor solar.',
  },
  {
    id: 'roof_concrete_xps',
    name: 'Losa Plana Aislada con Poliestireno Extruido XPS (80 mm)',
    category: 'roof',
    uValue: 0.42,
    standard: 'IRAM 11605 (Nivel A)',
    desc: 'Cubierta invertida impermeabilizada con placas de XPS de alta densidad.',
  },
  {
    id: 'roof_suspended_attic',
    name: 'Cielorraso Suspendido bajo Ático / Cámara Ventilada',
    category: 'roof',
    uValue: 0.75,
    standard: 'ASHRAE Fundamentals',
    desc: 'Techo inclinado con cámara de aire y cielorraso suspendido de yeso.',
  },
  {
    id: 'roof_metal_uninsulated',
    name: 'Chapa Metálica Desnuda Acanalada (Sin aislación)',
    category: 'roof',
    uValue: 5.80,
    standard: 'IRAM 11605 (Nivel C)',
    desc: 'Cubierta metálica simple sin aislación ni cielorraso (extrema ganancia/pérdida térmica).',
  },
  {
    id: 'roof_metal_sandwich_pur',
    name: 'Techo de Chapa con Panel Sándwich Aislado PUR (100 mm)',
    category: 'roof',
    uValue: 0.26,
    standard: 'IRAM / ASHRAE 90.1',
    desc: 'Chapa conformada con núcleo de espuma de poliuretano de 100mm para locales y naves.',
  },
  {
    id: 'roof_tile_insulated',
    name: 'Techo de Tejas Cerámicas con Aislación Térmica (50 mm)',
    category: 'roof',
    uValue: 0.52,
    standard: 'IRAM 11605 (Nivel B)',
    desc: 'Techo tradicional con tejas coloniales/francesas, machimbre y membrana aislante.',
  },

  // VIDRIOS Y ABERTURAS
  {
    id: 'window_single_clear',
    name: 'Vidrio Simple Transparente (4 mm)',
    category: 'window',
    uValue: 5.80,
    shgc: 0.82,
    standard: 'IRAM 11507 / ASHRAE',
    desc: 'Vidrio monolítico común sin tratamiento térmico ni cámara de aire.',
  },
  {
    id: 'window_double_air',
    name: 'Doble Vidriado Hermético DVH Estándar (4-12-4 Aire)',
    category: 'window',
    uValue: 2.80,
    shgc: 0.70,
    standard: 'IRAM 11507-4',
    desc: 'Dos cristales de 4mm separados por cámara de aire seco deshidratado de 12mm.',
  },
  {
    id: 'window_double_low_e',
    name: 'DVH Bajo Emisivo (Low-E) con Gas Argón',
    category: 'window',
    uValue: 1.40,
    shgc: 0.40,
    standard: 'ASHRAE 90.1 / IRAM',
    desc: 'Capa metálica microscópica reflectiva de calor con cámara rellena de gas argón.',
  },
  {
    id: 'window_solar_tinted',
    name: 'Vidrio Simple Polarizado / Tonalizado de Control Solar',
    category: 'window',
    uValue: 5.40,
    shgc: 0.45,
    standard: 'ASHRAE Fundamentals',
    desc: 'Cristal coloreado en masa (gris o bronce) que absorbe y reduce la radiación solar directa.',
  },
  {
    id: 'window_triple_argon',
    name: 'Triple Vidriado Hermético de Alta Eficiencia (Passivhaus)',
    category: 'window',
    uValue: 0.85,
    shgc: 0.32,
    standard: 'Passivhaus Standard',
    desc: 'Tres cristales con dos cámaras de gas argón y doble capa bajo emisiva para pérdidas mínimas.',
  },
];

const STORAGE_KEY = 'climathermal_materials_db_v1';

export function getStoredMaterials(): MaterialItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MATERIALS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_MATERIALS;
}

export function saveMaterialsToStorage(materials: MaterialItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
  } catch (err) {
    console.error('Error al guardar materiales en localStorage', err);
  }
}
