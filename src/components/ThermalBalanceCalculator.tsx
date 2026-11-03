import React, { useState } from 'react';
import { 
  ThermalBalanceInputs, 
  HeatLoadBreakdown, 
  FacilityType, 
  Orientation, 
  ShadingType, 
  ActivityLevel,
  ApplianceItem,
  CalculationMode,
  MaterialItem,
  PsychrometricState 
} from '../types';
import { 
  ORIENTATION_SOLAR_PEAK, 
  SHADING_FACTORS, 
  OCCUPANT_METABOLIC, 
  APPLIANCE_PRESETS, 
  FACILITY_DEFAULTS 
} from '../utils/constants';
import { calculateHeatLoads } from '../utils/thermalCalculations';
import { HeatLoadBreakdownChart } from './HeatLoadBreakdownChart';
import { exportToPdf, exportToExcel } from '../utils/exportHelpers';
import { 
  Building2, 
  Sun, 
  Users, 
  Zap, 
  Snowflake, 
  Flame, 
  Plus, 
  Trash2, 
  Layers, 
  Compass, 
  Clock,
  Wind,
  FileText,
  FileSpreadsheet,
  Download,
  Lightbulb,
  ArrowUpRight
} from 'lucide-react';

interface ThermalBalanceCalculatorProps {
  materialsList: MaterialItem[];
  psychroState?: PsychrometricState;
  onNavigateToPsychrometric?: (indoorTemp: number, indoorRh: number, outdoorTemp: number, outdoorRh: number) => void;
  onNavigateToMaterials?: () => void;
  onNavigateToConverter?: () => void;
}

export const ThermalBalanceCalculator: React.FC<ThermalBalanceCalculatorProps> = ({
  materialsList,
  psychroState,
  onNavigateToPsychrometric,
  onNavigateToMaterials,
  onNavigateToConverter,
}) => {
  // Estado inicial del cálculo
  const [inputs, setInputs] = useState<ThermalBalanceInputs>({
    mode: 'summer',
    facilityType: 'commercial_kiosk',
    dimensions: {
      length: 6.0,
      width: 4.0,
      height: 3.0,
      customArea: undefined,
      customVolume: undefined,
    },
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
    appliances: [
      { id: 'k1', name: 'Heladera Exhibidora Comercial', quantity: 8, wattsPerUnit: 800, category: 'refrigeration' },
      { id: 'k2', name: 'Freezer de Helados / Pozo', quantity: 2, wattsPerUnit: 600, category: 'refrigeration' },
      { id: 'k3', name: 'Terminal Punto de Venta (POS)', quantity: 2, wattsPerUnit: 120, category: 'computing' },
      { id: 'k4', name: 'Cafetera Espresso Comercial', quantity: 1, wattsPerUnit: 1500, category: 'kitchen' },
      { id: 'k5', name: 'Iluminación Marquesina y Cartelería', quantity: 1, wattsPerUnit: 350, category: 'lighting' },
    ],
    simulation: {
      designHour: 15, // 15:00 hs hora pico tarde
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
    safetyFactor: 0.15,
  });

  const [isManualOverride, setIsManualOverride] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppQty, setNewAppQty] = useState(1);
  const [newAppWatts, setNewAppWatts] = useState(500);

  // Materiales separados por categoría
  const wallMaterials = materialsList.filter(m => m.category === 'wall');
  const roofMaterials = materialsList.filter(m => m.category === 'roof');
  const windowMaterials = materialsList.filter(m => m.category === 'window');

  // Cálculos geométricos
  const calcArea = inputs.dimensions.length * inputs.dimensions.width;
  const calcVolume = calcArea * inputs.dimensions.height;

  // Cálculo en tiempo real de cargas térmicas
  const results: HeatLoadBreakdown = calculateHeatLoads(inputs, materialsList);

  const isWinter = inputs.mode === 'winter';

  const handleModeChange = (newMode: CalculationMode) => {
    if (newMode === inputs.mode) return;
    if (newMode === 'winter') {
      setInputs((prev) => ({
        ...prev,
        mode: 'winter',
        designConditions: {
          ...prev.designConditions,
          outdoorTempC: 3,
          outdoorRh: 75,
          indoorTempC: 21,
          indoorRh: 45,
        },
      }));
    } else {
      setInputs((prev) => ({
        ...prev,
        mode: 'summer',
        designConditions: {
          ...prev.designConditions,
          outdoorTempC: 36,
          outdoorRh: 45,
          indoorTempC: 23,
          indoorRh: 50,
        },
      }));
    }
  };

  const handleFacilityChange = (facility: FacilityType) => {
    const defaults = FACILITY_DEFAULTS[facility];
    if (defaults) {
      setInputs((prev) => ({
        ...prev,
        facilityType: facility,
        dimensions: {
          ...prev.dimensions,
          ...defaults.dimensions,
          customArea: undefined,
          customVolume: undefined,
        },
        envelope: {
          ...prev.envelope,
          wallMaterialId: defaults.envelope?.wallMaterialId ?? prev.envelope.wallMaterialId,
          roofMaterialId: defaults.envelope?.roofMaterialId ?? prev.envelope.roofMaterialId,
          windowMaterialId: defaults.envelope?.windowMaterialId ?? prev.envelope.windowMaterialId,
          windowToWallRatio: defaults.envelope?.windowToWallRatio ?? prev.envelope.windowToWallRatio,
          orientation: defaults.envelope?.orientation ?? prev.envelope.orientation,
          shading: defaults.envelope?.shading ?? prev.envelope.shading,
        },
        occupancy: {
          ...prev.occupancy,
          ...defaults.occupancy,
        },
        lighting: {
          ...prev.lighting,
          ...defaults.lighting,
        },
        ventilation: {
          ...prev.ventilation,
          ...defaults.ventilation,
        },
        appliances: defaults.appliances || prev.appliances,
        safetyFactor: defaults.safetyFactor ?? 0.10,
      }));
      setIsManualOverride(false);
    }
  };

  const handleAddPresetAppliance = (preset: typeof APPLIANCE_PRESETS[0]) => {
    const newItem: ApplianceItem = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: preset.name,
      quantity: preset.quantity,
      wattsPerUnit: preset.wattsPerUnit,
      category: preset.category,
    };
    setInputs((prev) => ({
      ...prev,
      appliances: [...prev.appliances, newItem],
    }));
  };

  const handleAddCustomAppliance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;
    const newItem: ApplianceItem = {
      id: `app_${Date.now()}`,
      name: newAppName.trim(),
      quantity: Math.max(1, newAppQty),
      wattsPerUnit: Math.max(1, newAppWatts),
      category: 'custom',
    };
    setInputs((prev) => ({
      ...prev,
      appliances: [...prev.appliances, newItem],
    }));
    setNewAppName('');
    setNewAppQty(1);
    setNewAppWatts(500);
  };

  const handleUpdateAppliance = (id: string, updates: Partial<ApplianceItem>) => {
    setInputs((prev) => ({
      ...prev,
      appliances: prev.appliances.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }));
  };

  const handleRemoveAppliance = (id: string) => {
    setInputs((prev) => ({
      ...prev,
      appliances: prev.appliances.filter((item) => item.id !== id),
    }));
  };

  // Export handlers
  const handleDownloadPdf = () => {
    exportToPdf(inputs, results, psychroState, materialsList);
  };

  const handleDownloadExcel = () => {
    exportToExcel(inputs, results, psychroState);
  };

  // Materiales actualmente seleccionados
  const currentWall = materialsList.find(m => m.id === inputs.envelope.wallMaterialId);
  const currentRoof = materialsList.find(m => m.id === inputs.envelope.roofMaterialId);
  const currentWindow = materialsList.find(m => m.id === inputs.envelope.windowMaterialId);

  return (
    <div className="space-y-6">
      {/* Banner Superior con Botones OBLIGATORIOS de Exportación PDF / Excel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 text-white dark:bg-slate-900/90 border border-slate-800 shadow-md">
        <div>
          <span className="text-xs text-sky-400 font-mono tracking-wide uppercase">
            Cálculo Avanzado de Cargas Térmicas (IRAM 11605 / ASHRAE)
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
            Balance Térmico {isWinter ? 'en Calefacción' : 'en Refrigeración'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isWinter
              ? 'Determina las pérdidas térmicas por transmisión en cerramientos e infiltración de aire exterior para dimensionar la caldera o bomba de calor.'
              : 'Determina las ganancias de calor por transmisión en envolvente (Q = U · A · ΔT), radiación solar horaria, ocupantes, iluminación y heladeras comerciales.'}
          </p>
        </div>

        {/* Acciones de Cabecera: Selector Verano/Invierno + Botones OBLIGATORIOS de Exportación */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Modo */}
          <div className="flex items-center p-1 bg-slate-800 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => handleModeChange('summer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                !isWinter
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>Verano (Frío)</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('winter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isWinter
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Invierno (Calor)</span>
            </button>
          </div>

          {/* BOTÓN OBLIGATORIO 1: Descargar Informe PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Descargar memoria de cálculo completa en PDF usando jsPDF"
          >
            <FileText className="w-4 h-4" />
            <span>Descargar Informe PDF</span>
          </button>

          {/* BOTÓN OBLIGATORIO 2: Exportar a Excel (.xlsx) */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Descargar planilla de cálculo en Excel usando SheetJS (XLSX)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar a Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Franja de Resultados Principales en Varias Unidades Simultanéamente */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Frigorías / hora (kcal/h) */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isWinter ? 'Calorías / hora (kcal/h)' : 'Frigorías / hora'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 font-semibold">
              kcal/h
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-sky-600 dark:text-sky-400 tabular-nums">
              {results.totalFrigoriasPerHour.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500 font-mono">
              {isWinter ? 'Cal/h' : 'Frig/h'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block truncate">
            Comercial: <strong>{results.recommendedCommercialFrigorias.toLocaleString()} {isWinter ? 'Cal/h' : 'Frig/h'}</strong>
          </span>
        </div>

        {/* Watts y Kilowatts */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Potencia Térmica</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
              {results.totalWatts.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 font-mono">W</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
            {results.totalKilowatts} kW térmicos
          </span>
        </div>

        {/* BTU / hora */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Capacidad en BTU/h</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-semibold">
              BTU/h
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
              {results.totalBtuPerHour.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500 font-mono">BTU/h</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
            Sensible: {results.totalSensible.toLocaleString()} W
          </span>
        </div>

        {/* Toneladas de Refrigeración (TR) */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Toneladas (TR)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold">
              TR
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {results.recommendedTonsRefrigeration}
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 font-mono">TR</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
            1 TR = 3.024 Frig/h
          </span>
        </div>

        {/* Caudal de Aire Volumétrico Necesario (m³/h y CFM) */}
        <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-800 dark:text-sky-300">Caudal de Aire</span>
            <Wind className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-sky-700 dark:text-sky-300 tabular-nums">
              {results.supplyAirflowCfm.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400 font-mono">CFM</span>
          </div>
          <span className="text-[11px] font-mono text-sky-800/80 dark:text-sky-300/80 block">
            {results.supplyAirflowM3h.toLocaleString()} m³/hora
          </span>
        </div>
      </div>

      {/* Grid: Parámetros Técnicos (8 columnas) + Gráfico de Aportes y Desglose (4 columnas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Parámetros de Entrada */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Tipo de Recinto y Dimensiones */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-500" />
                1. Tipo de Recinto y Geometría del Espacio
              </h3>
              
              <div className="flex items-center gap-2">
                <label htmlFor="fac-select-input" className="text-xs text-slate-500">Recinto:</label>
                <select
                  id="fac-select-input"
                  value={inputs.facilityType}
                  onChange={(e) => handleFacilityChange(e.target.value as FacilityType)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="commercial_kiosk">Kiosco / Local Comercial (con heladeras)</option>
                  <option value="residential">Casa / Residencial</option>
                  <option value="office">Oficina Corporativa</option>
                  <option value="restaurant">Restaurante / Cafetería</option>
                  <option value="auditorium">Auditorio / Cine</option>
                  <option value="fitness_gym">Gimnasio / Fitness</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="dim-l" className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                  Largo (m)
                </label>
                <input
                  id="dim-l"
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={inputs.dimensions.length}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      dimensions: { ...prev.dimensions, length: Math.max(0.5, parseFloat(e.target.value) || 0.5) },
                    }))
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label htmlFor="dim-w" className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                  Ancho (m)
                </label>
                <input
                  id="dim-w"
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={inputs.dimensions.width}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      dimensions: { ...prev.dimensions, width: Math.max(0.5, parseFloat(e.target.value) || 0.5) },
                    }))
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label htmlFor="dim-h" className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                  Altura de Techo (m)
                </label>
                <input
                  id="dim-h"
                  type="number"
                  step="0.1"
                  min="1.8"
                  value={inputs.dimensions.height}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      dimensions: { ...prev.dimensions, height: Math.max(1.8, parseFloat(e.target.value) || 2.4) },
                    }))
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Superficie en Planta:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {calcArea.toFixed(1)} m²
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Volumen del Recinto:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {calcVolume.toFixed(1)} m³
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Paredes Perimetrales:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {(2 * (inputs.dimensions.length + inputs.dimensions.width) * inputs.dimensions.height).toFixed(1)} m²
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">
                Perímetro: {(2 * (inputs.dimensions.length + inputs.dimensions.width)).toFixed(1)} m
              </span>
            </div>
          </div>

          {/* Card 2: Envolvente, Materiales (vinculados a Base de Datos) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-500" />
                2. Envolvente Térmica (Transmitancia U vinculada a Base de Datos)
              </h3>
              {onNavigateToMaterials && (
                <button
                  type="button"
                  onClick={onNavigateToMaterials}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver/Editar Base de Datos</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Muros */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="wall-db-select" className="font-medium text-slate-700 dark:text-slate-300">
                    Muros Exteriores
                  </label>
                  <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
                    U = {currentWall?.uValue ?? 1.6} W/m²K
                  </span>
                </div>
                <select
                  id="wall-db-select"
                  value={inputs.envelope.wallMaterialId}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      envelope: { ...prev.envelope, wallMaterialId: e.target.value },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {wallMaterials.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} (U={mat.uValue})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {currentWall?.desc}
                </p>
              </div>

              {/* Techo */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="roof-db-select" className="font-medium text-slate-700 dark:text-slate-300">
                    Techo / Cubierta
                  </label>
                  <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
                    U = {currentRoof?.uValue ?? 0.8} W/m²K
                  </span>
                </div>
                <select
                  id="roof-db-select"
                  value={inputs.envelope.roofMaterialId}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      envelope: { ...prev.envelope, roofMaterialId: e.target.value },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {roofMaterials.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} (U={mat.uValue})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {currentRoof?.desc}
                </p>
              </div>

              {/* Vidrio */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="win-db-select" className="font-medium text-slate-700 dark:text-slate-300">
                    Vidrio / Aberturas
                  </label>
                  <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
                    U = {currentWindow?.uValue ?? 2.8} W/m²K
                  </span>
                </div>
                <select
                  id="win-db-select"
                  value={inputs.envelope.windowMaterialId}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      envelope: { ...prev.envelope, windowMaterialId: e.target.value },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {windowMaterials.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} (U={mat.uValue}, SHGC={mat.shgc ?? 0.7})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {currentWindow?.desc}
                </p>
              </div>
            </div>

            {/* Superficie Vidriada */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400">
                  Superficie Vidriada (% respecto a las paredes perimetrales)
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {Math.round(inputs.envelope.windowToWallRatio * 100)}% de Cristales
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={inputs.envelope.windowToWallRatio}
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    envelope: { ...prev.envelope, windowToWallRatio: parseFloat(e.target.value) },
                  }))
                }
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Card 3: Orientación Solar, Sombras y Simulador de Hora Pico */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Compass className="w-4 h-4 text-sky-500" />
              3. Orientación Solar, Sombras y Hora de Diseño
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="ori-select" className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                  Orientación Cardinal de Ventanas
                </label>
                <select
                  id="ori-select"
                  value={inputs.envelope.orientation}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      envelope: { ...prev.envelope, orientation: e.target.value as Orientation },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer"
                >
                  {Object.entries(ORIENTATION_SOLAR_PEAK).map(([k, v]) => (
                    <option key={k} value={k}>{k} — {v.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="shd-select" className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                  Protección Solar / Sombras
                </label>
                <select
                  id="shd-select"
                  value={inputs.envelope.shading}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      envelope: { ...prev.envelope, shading: e.target.value as ShadingType },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer"
                >
                  {Object.entries(SHADING_FACTORS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Hora Pico de Diseño
                  </span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {inputs.simulation?.designHour ?? 15}:00 hs
                  </span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="19"
                  step="1"
                  value={inputs.simulation?.designHour ?? 15}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      simulation: { designHour: parseInt(e.target.value) || 15 },
                    }))
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block">Modula la irradiancia solar horaria incidente</span>
              </div>
            </div>
          </div>

          {/* Card 4: Infiltración / Renovación de Aire & Iluminación */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Wind className="w-4 h-4 text-sky-500" />
              4. Infiltración y Renovación de Aire + Carga por Iluminación
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Renovación de Aire */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Ventilación / Infiltración (Normativa ASHRAE 62.1)
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="vent-mode"
                      checked={inputs.ventilation.method === 'ach'}
                      onChange={() => setInputs(prev => ({ ...prev, ventilation: { ...prev.ventilation, method: 'ach' } }))}
                      className="text-sky-600"
                    />
                    <span>Por Renovaciones (ACH)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="vent-mode"
                      checked={inputs.ventilation.method === 'per_person'}
                      onChange={() => setInputs(prev => ({ ...prev, ventilation: { ...prev.ventilation, method: 'per_person' } }))}
                      className="text-sky-600"
                    />
                    <span>Por Persona (L/s)</span>
                  </label>
                </div>

                {inputs.ventilation.method === 'ach' ? (
                  <div>
                    <label htmlFor="vent-ach-input" className="text-[11px] text-slate-500 block mb-1">
                      Renovaciones de aire por hora (ACH)
                    </label>
                    <input
                      id="vent-ach-input"
                      type="number"
                      step="0.2"
                      min="0.2"
                      max="8"
                      value={inputs.ventilation.ach}
                      onChange={(e) => setInputs(prev => ({ ...prev, ventilation: { ...prev.ventilation, ach: parseFloat(e.target.value) || 1 } }))}
                      className="w-full px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="vent-lps-input" className="text-[11px] text-slate-500 block mb-1">
                      Caudal de aire fresco por persona (L/s por persona)
                    </label>
                    <input
                      id="vent-lps-input"
                      type="number"
                      step="1"
                      min="5"
                      max="30"
                      value={inputs.ventilation.litersPerSecondPerPerson}
                      onChange={(e) => setInputs(prev => ({ ...prev, ventilation: { ...prev.ventilation, litersPerSecondPerPerson: parseFloat(e.target.value) || 10 } }))}
                      className="w-full px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Iluminación */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  Carga por Iluminación Artificial
                </span>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label htmlFor="light-type-select" className="text-[11px] text-slate-500 block mb-1">Tecnología</label>
                    <select
                      id="light-type-select"
                      value={inputs.lighting.fixtureType}
                      onChange={(e) => setInputs(prev => ({ ...prev, lighting: { ...prev.lighting, fixtureType: e.target.value as any } }))}
                      className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="led">LED Eficiente</option>
                      <option value="fluorescent">Tubos Fluoresc.</option>
                      <option value="halogen">Dicroicas Halógenas</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="light-qty-input" className="text-[11px] text-slate-500 block mb-1">Cant. Luces</label>
                    <input
                      id="light-qty-input"
                      type="number"
                      min="0"
                      value={inputs.lighting.quantity}
                      onChange={(e) => setInputs(prev => ({ ...prev, lighting: { ...prev.lighting, quantity: parseInt(e.target.value) || 0 } }))}
                      className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label htmlFor="light-watts-input" className="text-[11px] text-slate-500 block mb-1">Watts c/u</label>
                    <input
                      id="light-watts-input"
                      type="number"
                      min="0"
                      value={inputs.lighting.wattsPerFixture}
                      onChange={(e) => setInputs(prev => ({ ...prev, lighting: { ...prev.lighting, wattsPerFixture: parseFloat(e.target.value) || 0 } }))}
                      className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-right"
                    />
                  </div>
                </div>

                <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 flex justify-between">
                  <span>Disipación térmica luces:</span>
                  <span className="font-bold">{results.lighting.toLocaleString()} W</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Ocupantes y Equipos / Heladeras Comerciales */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  5. Ocupantes y Equipos / Heladeras Comerciales
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Calor disipado por heladeras exhibidoras (crucial en kioscos) y metabolismo de personas
                </p>
              </div>

              <span className="text-xs font-mono font-semibold text-purple-600 dark:text-purple-400">
                Aporte Equipos: {results.appliances.toLocaleString()} W
              </span>
            </div>

            {/* Ocupantes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <label htmlFor="people-input" className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                  Cantidad de Personas
                </label>
                <input
                  id="people-input"
                  type="number"
                  min="0"
                  value={inputs.occupancy.peopleCount}
                  onChange={(e) => setInputs(prev => ({ ...prev, occupancy: { ...prev.occupancy, peopleCount: parseInt(e.target.value) || 0 } }))}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label htmlFor="activity-input" className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                  Nivel de Actividad
                </label>
                <select
                  id="activity-input"
                  value={inputs.occupancy.activityLevel}
                  onChange={(e) => setInputs(prev => ({ ...prev, occupancy: { ...prev.occupancy, activityLevel: e.target.value as any } }))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer"
                >
                  {Object.entries(OCCUPANT_METABOLIC).map(([k, v]) => (
                    <option key={k} value={k}>{v.label} ({v.totalW} W)</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Presets rápidos de equipos */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                Agregar rápidamente equipo típico:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {APPLIANCE_PRESETS.slice(0, 6).map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleAddPresetAppliance(preset)}
                    className="px-2 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer flex items-center gap-1 border border-slate-200/80 dark:border-slate-700"
                  >
                    <Plus className="w-3 h-3 text-sky-500" />
                    {preset.name} ({preset.wattsPerUnit}W)
                  </button>
                ))}
              </div>
            </div>

            {/* Tabla de equipos */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Equipo / Electrodoméstico</th>
                    <th className="py-2 px-3 w-16 text-center">Cant.</th>
                    <th className="py-2 px-3 w-24 text-right">W/unidad</th>
                    <th className="py-2 px-3 w-24 text-right">Total (W)</th>
                    <th className="py-2 px-2 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {inputs.appliances.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                        {item.name}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateAppliance(item.id, { quantity: parseInt(e.target.value) || 1 })}
                          className="w-12 text-center text-xs py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={item.wattsPerUnit}
                          onChange={(e) => handleUpdateAppliance(item.id, { wattsPerUnit: parseFloat(e.target.value) || 0 })}
                          className="w-16 text-right text-xs py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {(item.quantity * item.wattsPerUnit).toLocaleString()} W
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveAppliance(item.id)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Agregar equipo personalizado */}
            <form onSubmit={handleAddCustomAppliance} className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <input
                type="text"
                placeholder="Nuevo equipo (ej. 10x Heladeras Exhibidoras)"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <input
                type="number"
                placeholder="Cant."
                min="1"
                value={newAppQty}
                onChange={(e) => setNewAppQty(parseInt(e.target.value) || 1)}
                className="w-14 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-mono"
              />
              <input
                type="number"
                placeholder="Watts"
                step="50"
                value={newAppWatts}
                onChange={(e) => setNewAppWatts(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right font-mono"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold cursor-pointer shadow-xs"
              >
                Agregar
              </button>
            </form>
          </div>

          {/* Card 6: Temperaturas y Humedad de Diseño */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Wind className="w-4 h-4 text-sky-500" />
              6. Temperaturas y Humedad de Diseño
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label htmlFor="temp-ext-input" className="text-slate-600 dark:text-slate-400 block mb-1">Temp. Exterior (°C)</label>
                <input
                  id="temp-ext-input"
                  type="number"
                  step="0.5"
                  value={inputs.designConditions.outdoorTempC}
                  onChange={(e) => setInputs(prev => ({ ...prev, designConditions: { ...prev.designConditions, outdoorTempC: parseFloat(e.target.value) || 0 } }))}
                  className="w-full px-2.5 py-1.5 font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label htmlFor="rh-ext-input" className="text-slate-600 dark:text-slate-400 block mb-1">HR Exterior (%)</label>
                <input
                  id="rh-ext-input"
                  type="number"
                  step="1"
                  min="5"
                  max="100"
                  value={inputs.designConditions.outdoorRh}
                  onChange={(e) => setInputs(prev => ({ ...prev, designConditions: { ...prev.designConditions, outdoorRh: parseFloat(e.target.value) || 50 } }))}
                  className="w-full px-2.5 py-1.5 font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label htmlFor="temp-int-input" className="text-slate-600 dark:text-slate-400 block mb-1">Set-point Interior (°C)</label>
                <input
                  id="temp-int-input"
                  type="number"
                  step="0.5"
                  value={inputs.designConditions.indoorTempC}
                  onChange={(e) => setInputs(prev => ({ ...prev, designConditions: { ...prev.designConditions, indoorTempC: parseFloat(e.target.value) || 24 } }))}
                  className="w-full px-2.5 py-1.5 font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label htmlFor="rh-int-input" className="text-slate-600 dark:text-slate-400 block mb-1">HR Interior (%)</label>
                <input
                  id="rh-int-input"
                  type="number"
                  step="1"
                  min="20"
                  max="80"
                  value={inputs.designConditions.indoorRh}
                  onChange={(e) => setInputs(prev => ({ ...prev, designConditions: { ...prev.designConditions, indoorRh: parseFloat(e.target.value) || 50 } }))}
                  className="w-full px-2.5 py-1.5 font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Gráfico de Aportes, Desglose y Acciones Rápidas */}
        <div className="lg:col-span-4 space-y-6">
          {/* Gráfico de Aportes Porcentuales (Torta / Dona SVG) */}
          <HeatLoadBreakdownChart breakdown={results} />

          {/* Desglose de Cargas y Botones de Exportación Directa */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800">
              Desglose Numérico de Cargas (W)
            </h3>

            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 dark:text-slate-400">Muros Exteriores:</span>
                <span className="font-mono text-slate-900 dark:text-slate-100">{results.envelopeWalls.toLocaleString()} W</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 dark:text-slate-400">Techo / Cubierta:</span>
                <span className="font-mono text-slate-900 dark:text-slate-100">{results.envelopeRoof.toLocaleString()} W</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 dark:text-slate-400">Conducción en Vidrios:</span>
                <span className="font-mono text-slate-900 dark:text-slate-100">{results.envelopeWindowsCond.toLocaleString()} W</span>
              </div>
              {!isWinter && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-600 dark:text-slate-400">Radiación Solar en Vidrios:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{results.solarRadiation.toLocaleString()} W</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 dark:text-slate-400">Ocupantes (Sens + Lat):</span>
                <span className="font-mono text-pink-600 dark:text-pink-400">{(results.occupantsSensible + results.occupantsLatent).toLocaleString()} W</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 dark:text-slate-400">Iluminación Artificial:</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{results.lighting.toLocaleString()} W</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 dark:text-slate-400">Equipos y Heladeras:</span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">{results.appliances.toLocaleString()} W</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 dark:text-slate-400">Renovación de Aire:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{(results.ventilationSensible + results.ventilationLatent).toLocaleString()} W</span>
              </div>
              <div className="flex items-center justify-between pt-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
                <span>Total Requerido:</span>
                <span className="font-mono text-sky-600 dark:text-sky-400">{results.totalWatts.toLocaleString()} W</span>
              </div>
            </div>

            {/* Botones de Exportación Directa */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="w-full py-2.5 px-3 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <FileText className="w-4 h-4" />
                <span>Descargar Informe PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadExcel}
                className="w-full py-2.5 px-3 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar a Excel (.xlsx)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
