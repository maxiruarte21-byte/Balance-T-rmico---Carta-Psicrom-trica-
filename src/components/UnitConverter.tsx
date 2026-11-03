import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  Sparkles, 
  Check, 
  Copy, 
  HelpCircle, 
  Calculator, 
  Building, 
  Flame, 
  Snowflake,
  Info
} from 'lucide-react';

export const UnitConverter: React.FC = () => {
  // Base value in Watts (reference pivot)
  const [baseWatts, setBaseWatts] = useState<number>(3516.85); // 1 TR default
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Conversion factors relative to 1 Watt:
  // 1 W = 0.859845 Frig/h (kcal/h)
  // 1 W = 3.412142 BTU/h
  // 1 W = 1 / 3516.8528 TR = 0.000284345 TR
  const W_TO_FRIG = 0.8598452;
  const W_TO_BTU = 3.4121416;
  const W_TO_TR = 1 / 3516.8528;

  // Current values
  const valWatts = baseWatts;
  const valKw = baseWatts / 1000;
  const valFrig = baseWatts * W_TO_FRIG;
  const valBtu = baseWatts * W_TO_BTU;
  const valTr = baseWatts * W_TO_TR;

  // Handlers for inputs
  const handleFrigChange = (v: number) => {
    const w = v / W_TO_FRIG;
    setBaseWatts(Math.max(0, isNaN(w) ? 0 : w));
  };

  const handleWattsChange = (v: number) => {
    setBaseWatts(Math.max(0, isNaN(v) ? 0 : v));
  };

  const handleKwChange = (v: number) => {
    setBaseWatts(Math.max(0, isNaN(v) ? 0 : v * 1000));
  };

  const handleBtuChange = (v: number) => {
    const w = v / W_TO_BTU;
    setBaseWatts(Math.max(0, isNaN(w) ? 0 : w));
  };

  const handleTrChange = (v: number) => {
    const w = v / W_TO_TR;
    setBaseWatts(Math.max(0, isNaN(w) ? 0 : w));
  };

  // Quick preset loader
  const setPresetWatts = (w: number) => {
    setBaseWatts(w);
  };

  const handleCopy = (label: string, value: string) => {
    navigator.clipboard.writeText(`${value} ${label}`);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Rule of thumb area estimator
  const [estimArea, setEstimArea] = useState<number>(30);
  const [estimType, setEstimType] = useState<number>(60); // Frig/m² (default 60 for standard residential)

  const estimatedFrig = estimArea * estimType;
  const estimatedTr = (estimatedFrig / 3024).toFixed(2);
  const estimatedBtu = Math.round(estimatedFrig * 3.968);
  const estimatedW = Math.round(estimatedFrig * 1.163);

  // Commercial standard models
  const commercialModels = [
    { name: 'Split 2.250 Frig/h', frig: 2250, btu: 9000, tr: 0.75, kw: 2.6, use: 'Dormitorio / Ambiente chico (hasta 15 m²)' },
    { name: 'Split 3.000 Frig/h', frig: 3000, btu: 12000, tr: 1.0, kw: 3.5, use: 'Living estándar / Oficina mediana (16 a 25 m²)' },
    { name: 'Split 4.500 Frig/h', frig: 4500, btu: 18000, tr: 1.5, kw: 5.2, use: 'Comercio / Kiosco chico / Salón (26 a 35 m²)' },
    { name: 'Split 6.000 Frig/h', frig: 6000, btu: 24000, tr: 2.0, kw: 7.0, use: 'Local comercial / Kiosco con heladeras (36 a 50 m²)' },
    { name: 'Piso-Techo 9.000 Frig/h', frig: 9000, btu: 36000, tr: 3.0, kw: 10.5, use: 'Restaurante / Sala de servidores (50 a 80 m²)' },
    { name: 'Central 15.000 Frig/h', frig: 15000, btu: 60000, tr: 5.0, kw: 17.5, use: 'Auditorio / Local gastronómico / Gimnasio' },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 text-white dark:bg-slate-900/90 border border-slate-800">
        <div>
          <span className="text-xs text-sky-400 font-mono tracking-wide uppercase">
            Herramienta de Ingeniería Térmica
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
            Conversor de Unidades de Climatización y Potencia
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Conversión bidireccional instantánea y exacta entre Frigorías/h (kcal/h), Watts (W / kW), BTU/h y Toneladas de Refrigeración (TR).
          </p>
        </div>

        {/* Quick Presets Buttons */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-xs text-slate-400 mr-1">Cargar Modelo:</span>
          {[
            { label: '1 TR (12k BTU)', w: 3516.85 },
            { label: '2.250 Frig (9k BTU)', w: 2616.75 },
            { label: '3.000 Frig (12k BTU)', w: 3489.0 },
            { label: '6.000 Frig (24k BTU)', w: 6978.0 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setPresetWatts(preset.w)}
              className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer border border-slate-700 whitespace-nowrap"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Converter Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-sky-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Conversión Bidireccional en Tiempo Real
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Modifica cualquiera de los campos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Frigorías/h */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="conv-frig" className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                Frigorías / hora
              </label>
              <button
                type="button"
                onClick={() => handleCopy('Frigorías/h', Math.round(valFrig).toString())}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="Copiar valor"
              >
                {copiedKey === 'Frigorías/h' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="relative">
              <input
                id="conv-frig"
                type="number"
                step="50"
                value={Math.round(valFrig)}
                onChange={(e) => handleFrigChange(parseFloat(e.target.value) || 0)}
                className="w-full text-lg font-bold font-mono px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none tabular-nums"
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400 pointer-events-none">
                Frig/h
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              Equivale exactamente a kcal/h
            </span>
          </div>

          {/* Watts (W) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="conv-watts" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Watts Térmicos (W)
              </label>
              <button
                type="button"
                onClick={() => handleCopy('Watts', Math.round(valWatts).toString())}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="Copiar valor"
              >
                {copiedKey === 'Watts' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="relative">
              <input
                id="conv-watts"
                type="number"
                step="50"
                value={Math.round(valWatts)}
                onChange={(e) => handleWattsChange(parseFloat(e.target.value) || 0)}
                className="w-full text-lg font-bold font-mono px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none tabular-nums"
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400 pointer-events-none">
                W
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              1 Watt = 0.8598 Frigorías/h
            </span>
          </div>

          {/* Kilowatts (kW) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="conv-kw" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kilowatts (kW)
              </label>
              <button
                type="button"
                onClick={() => handleCopy('kW', valKw.toFixed(2))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="Copiar valor"
              >
                {copiedKey === 'kW' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="relative">
              <input
                id="conv-kw"
                type="number"
                step="0.1"
                value={+valKw.toFixed(2)}
                onChange={(e) => handleKwChange(parseFloat(e.target.value) || 0)}
                className="w-full text-lg font-bold font-mono px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none tabular-nums"
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400 pointer-events-none">
                kW
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              Potencia térmica en kW
            </span>
          </div>

          {/* BTU / hora */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="conv-btu" className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                BTU / hora
              </label>
              <button
                type="button"
                onClick={() => handleCopy('BTU/h', Math.round(valBtu).toString())}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="Copiar valor"
              >
                {copiedKey === 'BTU/h' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="relative">
              <input
                id="conv-btu"
                type="number"
                step="250"
                value={Math.round(valBtu)}
                onChange={(e) => handleBtuChange(parseFloat(e.target.value) || 0)}
                className="w-full text-lg font-bold font-mono px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none tabular-nums"
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400 pointer-events-none">
                BTU/h
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              1 BTU/h = 0.252 Frigorías/h
            </span>
          </div>

          {/* Toneladas de Refrigeración (TR) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="conv-tr" className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Toneladas (TR)
              </label>
              <button
                type="button"
                onClick={() => handleCopy('TR', valTr.toFixed(2))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="Copiar valor"
              >
                {copiedKey === 'TR' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="relative">
              <input
                id="conv-tr"
                type="number"
                step="0.25"
                value={+valTr.toFixed(2)}
                onChange={(e) => handleTrChange(parseFloat(e.target.value) || 0)}
                className="w-full text-lg font-bold font-mono px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none tabular-nums"
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400 pointer-events-none">
                TR
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              1 TR = 3.024 Frig/h = 12.000 BTU
            </span>
          </div>
        </div>
      </div>

      {/* Reference Cards & Commercial Sizing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Equivalencias Fijas y Fórmulas (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Equivalencias Clave */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Info className="w-4 h-4 text-sky-500" />
              Equivalencias Físicas y Factores de Conversión
            </h3>

            <div className="space-y-2.5 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="pt-2 flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">1 Tonelada de Refrigeración (TR)</span>
                <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">12.000 BTU/h = 3.024 Frig/h</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">1 TR en Kilowatts térmicos:</span>
                <span className="font-mono text-slate-900 dark:text-slate-100 font-semibold">3,517 kW (3.516,85 W)</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">1 Frigoría / hora (Frig/h)</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">1 kcal/h = 1,163 W</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">1 Frigoría/h en BTU/h:</span>
                <span className="font-mono text-slate-900 dark:text-slate-100 font-semibold">3,968 BTU/h</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">1 Kilowatt (kW) térmico</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">859,85 Frig/h = 3.412 BTU/h</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">1 BTU / hora</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">0,252 Frig/h = 0,293 W</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 text-[11px] text-sky-800 dark:text-sky-300 leading-relaxed">
              <strong>Nota técnica:</strong> La <em>Frigoría</em> es la unidad técnica tradicional en países hispanohablantes (Argentina, España, Uruguay, etc.), definida exactamente como 1 kilocaloría de calor sustraída por hora (1 kcal/h = 1 Frigoría/h = 1,163 Watts).
            </div>
          </div>

          {/* Card: Estimador Práctico por Superficie (m²) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Calculator className="w-4 h-4 text-emerald-500" />
              Estimador Rápido por Superficie (Regla Práctica)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="estim-area" className="text-slate-600 dark:text-slate-400 font-medium">
                    Superficie del Recinto (m²)
                  </label>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {estimArea} m²
                  </span>
                </div>
                <input
                  id="estim-area"
                  type="range"
                  min="5"
                  max="150"
                  step="1"
                  value={estimArea}
                  onChange={(e) => setEstimArea(parseInt(e.target.value) || 10)}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <label htmlFor="estim-type-select" className="text-slate-600 dark:text-slate-400 font-medium block mb-1">
                  Exposición y Carga Térmica Estimada
                </label>
                <select
                  id="estim-type-select"
                  value={estimType}
                  onChange={(e) => setEstimType(parseInt(e.target.value) || 60)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value={50}>50 Frig/m² — Residencial con buena aislación y sombra</option>
                  <option value={60}>60 Frig/m² — Estándar residencial / Oficina moderada</option>
                  <option value={80}>80 Frig/m² — Último piso / Techo de chapa / Ventanales al Oeste</option>
                  <option value={120}>120 Frig/m² — Local comercial / Kiosco con heladeras exhibidoras</option>
                </select>
              </div>

              {/* Resultado aproximado */}
              <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-1">
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium block">
                  Capacidad Estimada de Climatización:
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
                    {estimatedFrig.toLocaleString()} Frig/h
                  </span>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                    ({estimatedBtu.toLocaleString()} BTU / {estimatedTr} TR)
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 block">
                  Potencia térmica aprox.: {estimatedW.toLocaleString()} Watts ({(estimatedW / 1000).toFixed(2)} kW)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabla de Equipos Comerciales Estándar (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Tabla de Capacidades Comerciales Típicas de Aire Acondicionado
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gama de equipos Split, Multisplit y Paquetes comerciales más instalados en el mercado
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Modelo Comercial</th>
                  <th className="py-2.5 px-3 text-right">Frigorías/h</th>
                  <th className="py-2.5 px-3 text-right">BTU/h</th>
                  <th className="py-2.5 px-3 text-right">TR</th>
                  <th className="py-2.5 px-3 text-right">kW Frío</th>
                  <th className="py-2.5 px-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {commercialModels.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                      <div>{item.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{item.use}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-sky-600 dark:text-sky-400 tabular-nums">
                      {item.frig.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 tabular-nums">
                      {item.btu.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {item.tr.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400 tabular-nums">
                      {item.kw.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <button
                        type="button"
                        onClick={() => handleFrigChange(item.frig)}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 hover:text-sky-800 dark:hover:bg-sky-950 dark:hover:text-sky-300 transition-colors cursor-pointer"
                      >
                        Convertir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Consejo de Selección:</span>
            <p>
              En equipos Split residenciales y comerciales, siempre se recomienda redondear hacia el escalón comercial superior inmediato para garantizar que el compresor no trabaje forzado en los días de temperaturas extremas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
