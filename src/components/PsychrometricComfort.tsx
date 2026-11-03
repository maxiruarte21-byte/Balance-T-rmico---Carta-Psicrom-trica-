import React, { useState, useMemo } from 'react';
import { PsychrometricState, ComfortStatus } from '../types';
import { 
  computePsychrometricState, 
  altitudeToPressureKPa 
} from '../utils/psychrometrics';
import { PsychrometricChart } from './PsychrometricChart';
import { 
  Thermometer, 
  Droplets, 
  Gauge, 
  Wind, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Mountain, 
  ArrowRight,
  Info
} from 'lucide-react';

interface PsychrometricComfortProps {
  initialTempC?: number;
  initialRh?: number;
  outdoorTempC?: number;
  outdoorRh?: number;
}

export const PsychrometricComfort: React.FC<PsychrometricComfortProps> = ({
  initialTempC = 24.0,
  initialRh = 50.0,
  outdoorTempC = 35.0,
  outdoorRh = 48.0,
}) => {
  // Variables de estado
  const [dryBulbTempC, setDryBulbTempC] = useState<number>(initialTempC);
  const [relativeHumidity, setRelativeHumidity] = useState<number>(initialRh);
  const [altitudeMeters, setAltitudeMeters] = useState<number>(0);
  const [customPressureKPa, setCustomPressureKPa] = useState<number | null>(null);

  // Presión atmosférica
  const pressureKPa = useMemo(() => {
    if (customPressureKPa !== null && customPressureKPa > 0) {
      return customPressureKPa;
    }
    return altitudeToPressureKPa(altitudeMeters);
  }, [customPressureKPa, altitudeMeters]);

  // Estado psicrométrico interior evaluado
  const state = useMemo(() => {
    return computePsychrometricState(dryBulbTempC, relativeHumidity, pressureKPa, altitudeMeters);
  }, [dryBulbTempC, relativeHumidity, pressureKPa, altitudeMeters]);

  // Estado exterior para comparar
  const outdoorState = useMemo(() => {
    return computePsychrometricState(outdoorTempC, outdoorRh, pressureKPa, altitudeMeters);
  }, [outdoorTempC, outdoorRh, pressureKPa, altitudeMeters]);

  // Presets climáticos típicos
  const presets = [
    { name: 'Confort Ideal ASHRAE', temp: 23.5, rh: 50, desc: 'Neutralidad térmica y máxima satisfacción fisiológica' },
    { name: 'Verano Caluroso y Húmedo', temp: 34.0, rh: 72, desc: 'Clima tropical o litoral marítimo con bochorno' },
    { name: 'Clima Árido y Seco', temp: 39.0, rh: 20, desc: 'Alta carga sensible y muy baja humedad (enfriamiento evaporativo apto)' },
    { name: 'Invierno Calefaccionado Seco', temp: 21.5, rh: 24, desc: 'Ambiente calefaccionado con baja humedad relativa' },
    { name: 'Centro de Datos / Servidores', temp: 22.0, rh: 45, desc: 'Control estricto para evitar descargas electrostáticas y condensación' },
  ];

  const getComfortBadge = (status: ComfortStatus) => {
    switch (status) {
      case 'comfort_optimal':
        return {
          label: state.comfortTitle,
          className: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
          icon: CheckCircle2,
        };
      case 'too_warm_humid':
        return {
          label: state.comfortTitle,
          className: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
          icon: AlertTriangle,
        };
      case 'too_warm_dry':
        return {
          label: state.comfortTitle,
          className: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
          icon: AlertTriangle,
        };
      case 'too_cold_humid':
        return {
          label: state.comfortTitle,
          className: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
          icon: AlertTriangle,
        };
      case 'too_cold_dry':
        return {
          label: state.comfortTitle,
          className: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
          icon: AlertTriangle,
        };
      case 'high_humidity_risk':
        return {
          label: state.comfortTitle,
          className: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
          icon: AlertTriangle,
        };
      case 'low_humidity_dry':
        return {
          label: state.comfortTitle,
          className: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
          icon: AlertTriangle,
        };
    }
  };

  const badgeInfo = getComfortBadge(state.comfortAssessment);
  const BadgeIcon = badgeInfo.icon;

  return (
    <div className="space-y-6">
      {/* Banner Superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 text-white dark:bg-slate-900/90 border border-slate-800 shadow-md">
        <div>
          <span className="text-xs text-sky-400 font-mono tracking-wide uppercase">
            Psicrometría Termodinámica del Aire Húmedo
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
            Carta Psicrométrica y Análisis de Confort Térmico
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Monitorea el punto de estado del aire, entalpía específica, temperatura de bulbo húmedo, punto de rocío y evalúa el cumplimiento de la zona de confort según norma ASHRAE 55.
          </p>
        </div>

        {/* Presets Rápidos */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-xs text-slate-400 mr-1">Casos Típicos:</span>
          {presets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                setDryBulbTempC(preset.temp);
                setRelativeHumidity(preset.rh);
              }}
              title={preset.desc}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer border border-slate-700 whitespace-nowrap"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Parámetros del Usuario + Gráfico Interactivo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Parámetros del Aire (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card de Entradas del Usuario */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-sky-500" />
              Condiciones del Estado del Aire
            </h3>

            {/* Slider de Temperatura de Bulbo Seco */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="input-dry-bulb-es" className="font-medium text-slate-700 dark:text-slate-300">
                  Temperatura de Bulbo Seco (Tbs)
                </label>
                <div className="flex items-center gap-1 font-mono font-semibold text-sky-600 dark:text-sky-400">
                  <input
                    id="input-dry-bulb-es"
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={dryBulbTempC}
                    onChange={(e) => setDryBulbTempC(parseFloat(e.target.value) || 0)}
                    className="w-16 px-1.5 py-0.5 text-right text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <span>°C</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={dryBulbTempC}
                onChange={(e) => setDryBulbTempC(parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0°C</span>
                <span className="text-emerald-500">20°C - 26°C Confort</span>
                <span>50°C</span>
              </div>
            </div>

            {/* Slider de Humedad Relativa */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="input-rh-es" className="font-medium text-slate-700 dark:text-slate-300">
                  Humedad Relativa (HR)
                </label>
                <div className="flex items-center gap-1 font-mono font-semibold text-sky-600 dark:text-sky-400">
                  <input
                    id="input-rh-es"
                    type="number"
                    step="1"
                    min="5"
                    max="100"
                    value={relativeHumidity}
                    onChange={(e) => setRelativeHumidity(Math.max(5, Math.min(100, parseFloat(e.target.value) || 5)))}
                    className="w-16 px-1.5 py-0.5 text-right text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <span>%</span>
                </div>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="1"
                value={relativeHumidity}
                onChange={(e) => setRelativeHumidity(parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>5%</span>
                <span className="text-emerald-500">30% - 60% Confort</span>
                <span>100% (Sat)</span>
              </div>
            </div>

            {/* Presión Barométrica / Altitud */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-slate-500" />
                  Altitud sobre el Nivel del Mar / Presión
                </span>
                <span className="font-mono text-slate-500 text-[11px]">
                  {pressureKPa.toFixed(2)} kPa
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label htmlFor="input-altitude-es" className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Altitud (metros s.n.m.)
                  </label>
                  <input
                    id="input-altitude-es"
                    type="number"
                    step="100"
                    min="0"
                    max="4500"
                    value={altitudeMeters}
                    onChange={(e) => {
                      setAltitudeMeters(Math.max(0, parseFloat(e.target.value) || 0));
                      setCustomPressureKPa(null);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                    placeholder="0 m (Nivel del mar)"
                  />
                </div>
                <div>
                  <label htmlFor="input-pressure-es" className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Presión Directa (kPa)
                  </label>
                  <input
                    id="input-pressure-es"
                    type="number"
                    step="0.5"
                    min="50"
                    max="110"
                    value={customPressureKPa !== null ? customPressureKPa : ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : null;
                      setCustomPressureKPa(val);
                    }}
                    placeholder={pressureKPa.toFixed(2)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cartel / Badge de Estado de Confort */}
          <div className={`p-4 rounded-xl border ${badgeInfo.className} shadow-sm space-y-2`}>
            <div className="flex items-center gap-2 font-bold text-xs tracking-wide">
              <BadgeIcon className="w-4 h-4 shrink-0" />
              <span>{badgeInfo.label}</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              {state.comfortAdvice}
            </p>
          </div>

          {/* Guía Explicativa de la Norma ASHRAE 55 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-sky-500" />
              Criterios de Confort ASHRAE 55
            </div>
            <p className="text-[11px] leading-relaxed">
              La norma ASHRAE 55 establece que al menos el 80% de los ocupantes deben encontrarse en confort térmico. En condiciones normales de oficina (0.5 a 1.0 clo y 1.1 met), la temperatura operativa debe mantenerse entre <strong>20°C y 26°C</strong>, con humedad relativa del <strong>30% al 60%</strong> y punto de rocío menor a 16.8°C.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Carta Psicrométrica y Propiedades Termodinámicas (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Carta Psicrométrica Interactiva */}
          <PsychrometricChart
            currentState={state}
            outdoorState={outdoorState}
            onSelectCoordinates={(t, rh) => {
              setDryBulbTempC(t);
              setRelativeHumidity(rh);
            }}
          />

          {/* Rejilla de Propiedades Termodinámicas Calculadas */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Propiedades Termodinámicas del Aire Húmedo
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Presión ref: {pressureKPa.toFixed(2)} kPa
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Bulbo Húmedo */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Bulbo Húmedo (Tbh)</span>
                <span className="text-lg font-bold font-mono text-sky-600 dark:text-sky-400 tabular-nums">
                  {state.wetBulbTempC.toFixed(1)} <span className="text-xs font-normal text-slate-500">°C</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Saturación adiabática</span>
              </div>

              {/* Punto de Rocío */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Punto de Rocío (Tpr)</span>
                <span className="text-lg font-bold font-mono text-cyan-600 dark:text-cyan-400 tabular-nums">
                  {state.dewPointTempC.toFixed(1)} <span className="text-xs font-normal text-slate-500">°C</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Límite de condensación</span>
              </div>

              {/* Razón de Humedad */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Razón de Humedad (W)</span>
                <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {state.humidityRatioGKg.toFixed(2)} <span className="text-xs font-normal text-slate-500">g/kg</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{(state.humidityRatioKgKg * 1000).toFixed(2)} g vapor/kg aire</span>
              </div>

              {/* Entalpía Específica */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Entalpía Específica (h)</span>
                <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                  {state.specificEnthalpyKjKg.toFixed(1)} <span className="text-xs font-normal text-slate-500">kJ/kg</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Energía térmica total</span>
              </div>

              {/* Volumen Específico */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Volumen Específico (v)</span>
                <span className="text-lg font-bold font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                  {state.specificVolumeM3Kg.toFixed(3)} <span className="text-xs font-normal text-slate-500">m³/kg</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Base aire seco</span>
              </div>

              {/* Densidad del Aire */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Densidad del Aire (ρ)</span>
                <span className="text-lg font-bold font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                  {state.densityKgM3.toFixed(3)} <span className="text-xs font-normal text-slate-500">kg/m³</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Masa por m³</span>
              </div>

              {/* Presión de Vapor */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Presión de Vapor (Pw)</span>
                <span className="text-lg font-bold font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                  {state.vaporPressureKPa.toFixed(2)} <span className="text-xs font-normal text-slate-500">kPa</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Presión parcial vapor</span>
              </div>

              {/* Presión de Saturación */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Presión Saturación (Pws)</span>
                <span className="text-lg font-bold font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                  {state.saturationVaporPressureKPa.toFixed(2)} <span className="text-xs font-normal text-slate-500">kPa</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">A {state.dryBulbTempC}°C</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
