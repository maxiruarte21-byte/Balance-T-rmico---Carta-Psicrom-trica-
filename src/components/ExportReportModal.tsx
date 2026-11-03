import React, { useState } from 'react';
import { ThermalBalanceInputs, HeatLoadBreakdown, PsychrometricState } from '../types';
import { Printer, Download, X, Check, FileSpreadsheet, Copy } from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputs?: ThermalBalanceInputs;
  results?: HeatLoadBreakdown;
  psychrometricState?: PsychrometricState;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  inputs,
  results,
  psychrometricState,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyJson = () => {
    const reportData = {
      fechaGeneracion: new Date().toISOString(),
      balanceTermico: {
        modo: inputs?.mode === 'winter' ? 'Calefacción (Invierno)' : 'Refrigeración (Verano)',
        parametrosEntrada: inputs,
        cargasCalculadas: results,
      },
      psicrometria: psychrometricState,
    };
    navigator.clipboard.writeText(JSON.stringify(reportData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isWinter = inputs?.mode === 'winter';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Informe Técnico de Climatización y Balance Térmico
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generado el {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} · Normativa ASHRAE / IRAM
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Imprimible */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300 print-page">
          {/* Sección 1: Resultados del Balance Térmico */}
          {results && inputs && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                  1. Resumen de Cargas Térmicas ({isWinter ? 'Modo Calefacción' : 'Modo Refrigeración'})
                </h4>
                <span className="font-mono text-[11px] text-sky-600 dark:text-sky-400 font-semibold">
                  Recinto: {inputs.facilityType.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Tarjetas de Capacidad Simultánea en 4 Unidades */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    {isWinter ? 'Calorías / hora' : 'Frigorías / hora'}
                  </span>
                  <span className="text-lg font-bold font-mono text-sky-600 dark:text-sky-400">
                    {results.totalFrigoriasPerHour.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Comercial: {results.recommendedCommercialFrigorias.toLocaleString()} {isWinter ? 'Cal/h' : 'Frig/h'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Potencia Térmica</span>
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                    {results.totalWatts.toLocaleString()} W
                  </span>
                  <span className="text-[10px] text-slate-400 block">{results.totalKilowatts} kW térmicos</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Capacidad en BTU/h</span>
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                    {results.totalBtuPerHour.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block">BTU / hora</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Toneladas (TR)</span>
                  <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {results.recommendedTonsRefrigeration} TR
                  </span>
                  <span className="text-[10px] text-slate-400 block">Capacidad equivalente</span>
                </div>
              </div>

              {/* Parámetros de Diseño del Edificio */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                  Parámetros de Entrada del Proyecto
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
                  <div>Dimensiones: <strong>{inputs.dimensions.length}m × {inputs.dimensions.width}m × {inputs.dimensions.height}m</strong> (Área: {(inputs.dimensions.length * inputs.dimensions.width).toFixed(1)} m², Vol: {(inputs.dimensions.length * inputs.dimensions.width * inputs.dimensions.height).toFixed(1)} m³)</div>
                  <div>Condición Exterior: <strong>{inputs.designConditions.outdoorTempC}°C @ {inputs.designConditions.outdoorRh}% HR</strong></div>
                  <div>Set-point Interior: <strong>{inputs.designConditions.indoorTempC}°C @ {inputs.designConditions.indoorRh}% HR</strong></div>
                  <div>Renovación de Aire: <strong>{inputs.ventilation?.method === 'per_person' ? `${inputs.ventilation.litersPerSecondPerPerson} L/s/persona` : `${inputs.ventilation?.ach ?? 1.5} ACH`}</strong></div>
                  <div>Ocupación: <strong>{inputs.occupancy.peopleCount} personas ({inputs.occupancy.activityLevel})</strong></div>
                  <div>Carga de Equipos/Heladeras: <strong>{results.appliances.toLocaleString()} W</strong> ({inputs.appliances.length} items en lista)</div>
                  <div>Margen de Seguridad: <strong>+{(inputs.safetyFactor * 100).toFixed(0)}%</strong></div>
                  <div>Razón Calor Sensible (SHR): <strong>{results.sensibleHeatRatio}</strong> (Sensible: {results.totalSensible.toLocaleString()} W, Latente: {results.totalLatent.toLocaleString()} W)</div>
                </div>
              </div>
            </div>
          )}

          {/* Sección 2: Análisis Psicrométrico y Confort */}
          {psychrometricState && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200 dark:border-slate-800">
                2. Diagnóstico Psicrométrico y Zona de Confort (ASHRAE 55)
              </h4>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    Estado: {psychrometricState.comfortTitle}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Presión: {psychrometricState.pressureKPa.toFixed(2)} kPa
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {psychrometricState.comfortAdvice}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                  <div>Bulbo Seco: <strong>{psychrometricState.dryBulbTempC}°C</strong></div>
                  <div>Bulbo Húmedo: <strong>{psychrometricState.wetBulbTempC.toFixed(1)}°C</strong></div>
                  <div>Punto de Rocío: <strong>{psychrometricState.dewPointTempC.toFixed(1)}°C</strong></div>
                  <div>Humedad Relativa: <strong>{psychrometricState.relativeHumidity}%</strong></div>
                  <div>Razón de Humedad: <strong>{psychrometricState.humidityRatioGKg.toFixed(2)} g/kg</strong></div>
                  <div>Entalpía: <strong>{psychrometricState.specificEnthalpyKjKg.toFixed(1)} kJ/kg</strong></div>
                  <div>Volumen Específico: <strong>{psychrometricState.specificVolumeM3Kg.toFixed(3)} m³/kg</strong></div>
                  <div>Densidad del Aire: <strong>{psychrometricState.densityKgM3.toFixed(3)} kg/m³</strong></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Acciones del Modal */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyJson}
            className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Datos JSON'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
