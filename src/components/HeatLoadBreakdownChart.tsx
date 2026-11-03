import React, { useState } from 'react';
import { HeatLoadBreakdown } from '../types';

interface HeatLoadBreakdownChartProps {
  breakdown: HeatLoadBreakdown;
}

interface Segment {
  id: string;
  name: string;
  watts: number;
  percentage: number;
  color: string;
  description: string;
}

export const HeatLoadBreakdownChart: React.FC<HeatLoadBreakdownChartProps> = ({ breakdown }) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const isWinter = breakdown.mode === 'winter';
  const total = Math.max(1, breakdown.totalLoadSubtotal);

  let segments: Segment[] = [];

  if (isWinter) {
    // Modo Invierno (Pérdidas de calor a compensar)
    segments = [
      {
        id: 'walls',
        name: 'Pérdidas por Muros Exteriores',
        watts: breakdown.envelopeWalls,
        percentage: Math.round((breakdown.envelopeWalls / total) * 100),
        color: '#3b82f6', // blue
        description: `Transmisión térmica a través de paredes perimetrales (${breakdown.envelopeWalls.toLocaleString()} W)`,
      },
      {
        id: 'roof',
        name: 'Pérdidas por Techo / Cubierta',
        watts: breakdown.envelopeRoof,
        percentage: Math.round((breakdown.envelopeRoof / total) * 100),
        color: '#6366f1', // indigo
        description: `Escape térmico hacia el exterior por cubierta superior (${breakdown.envelopeRoof.toLocaleString()} W)`,
      },
      {
        id: 'windows',
        name: 'Pérdidas por Vidrios / Ventanas',
        watts: breakdown.envelopeWindowsCond,
        percentage: Math.round((breakdown.envelopeWindowsCond / total) * 100),
        color: '#06b6d4', // cyan
        description: `Pérdida por conducción en cristales y aberturas (${breakdown.envelopeWindowsCond.toLocaleString()} W)`,
      },
      {
        id: 'ventilation',
        name: 'Infiltración y Renovación de Aire Frío',
        watts: breakdown.ventilationSensible + breakdown.ventilationLatent,
        percentage: Math.round(((breakdown.ventilationSensible + breakdown.ventilationLatent) / total) * 100),
        color: '#10b981', // emerald
        description: `Energía necesaria para calentar el aire exterior ingresado (${(breakdown.ventilationSensible + breakdown.ventilationLatent).toLocaleString()} W)`,
      },
    ];
  } else {
    // Modo Verano (Ganancias de calor a remover)
    const envelopeWatts = breakdown.envelopeWalls + breakdown.envelopeRoof + breakdown.envelopeWindowsCond;
    const solarWatts = breakdown.solarRadiation;
    const occupantWatts = breakdown.occupantsSensible + breakdown.occupantsLatent;
    const applianceWatts = breakdown.appliances;
    const ventilationWatts = breakdown.ventilationSensible + breakdown.ventilationLatent;

    segments = [
      {
        id: 'envelope',
        name: 'Transmisión por Envolvente',
        watts: envelopeWatts,
        percentage: Math.round((envelopeWatts / total) * 100),
        color: '#3b82f6', // blue
        description: `Muros (${breakdown.envelopeWalls} W) + Techo (${breakdown.envelopeRoof} W) + Vidrios (${breakdown.envelopeWindowsCond} W)`,
      },
      {
        id: 'solar',
        name: 'Radiación Solar en Ventanas',
        watts: solarWatts,
        percentage: Math.round((solarWatts / total) * 100),
        color: '#f59e0b', // amber
        description: 'Irradiancia solar directa y difusa transmitida a través de los cristales',
      },
      {
        id: 'occupants',
        name: 'Carga Térmica de Ocupantes',
        watts: occupantWatts,
        percentage: Math.round((occupantWatts / total) * 100),
        color: '#ec4899', // pink
        description: `Metabolismo sensible (${breakdown.occupantsSensible} W) + Humedad latente (${breakdown.occupantsLatent} W)`,
      },
      {
        id: 'appliances',
        name: 'Equipos y Heladeras Comerciales',
        watts: applianceWatts,
        percentage: Math.round((applianceWatts / total) * 100),
        color: '#8b5cf6', // purple
        description: 'Heladeras exhibidoras, freezers, computadoras, cafeteras e iluminación',
      },
      {
        id: 'ventilation',
        name: 'Ventilación e Infiltración de Aire',
        watts: ventilationWatts,
        percentage: Math.round((ventilationWatts / total) * 100),
        color: '#10b981', // emerald
        description: `Carga sensible (${breakdown.ventilationSensible} W) + Humedad del aire exterior (${breakdown.ventilationLatent} W)`,
      },
    ];
  }

  // Filtrar segmentos con 0 W si no aportan
  const activeSegments = segments.filter((s) => s.watts > 0);

  // Dimensiones del gráfico de dona SVG
  const size = 260;
  const radius = 95;
  const strokeWidth = 32;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;

  const donutArcs = activeSegments.map((seg) => {
    const fraction = Math.max(0.005, seg.watts / total);
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += fraction;

    return {
      ...seg,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSegment = segments.find((s) => s.id === hoveredSegment);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {isWinter ? 'Aporte de Pérdidas Térmicas' : 'Distribución de Cargas Térmicas'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isWinter 
              ? 'Pérdidas de calor a compensar con calefacción' 
              : 'Porcentaje de calor sensible y latente a disipar'}
          </p>
        </div>
        <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300">
          Subtotal: {total.toLocaleString()} W
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Gráfico de Dona SVG */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-100 dark:text-slate-800"
            />
            {donutArcs.map((arc) => (
              <circle
                key={arc.id}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={arc.color}
                strokeWidth={hoveredSegment === arc.id ? strokeWidth + 6 : strokeWidth}
                strokeDasharray={arc.strokeDasharray}
                strokeDashoffset={arc.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredSegment(arc.id)}
                onMouseLeave={() => setHoveredSegment(null)}
              />
            ))}
          </svg>

          {/* Centro de la dona con texto dinámico */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            {activeSegment ? (
              <>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                  {activeSegment.name}
                </span>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {activeSegment.percentage}%
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {activeSegment.watts.toLocaleString()} W
                </span>
              </>
            ) : (
              <>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {isWinter ? 'Demanda Calor' : 'Carga Total'}
                </span>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {breakdown.totalWatts.toLocaleString()}
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Watts
                </span>
              </>
            )}
          </div>
        </div>

        {/* Barras Horizontales y Leyenda */}
        <div className="md:col-span-7 space-y-3">
          {segments.map((seg) => {
            const isHovered = hoveredSegment === seg.id;
            return (
              <div
                key={seg.id}
                onMouseEnter={() => setHoveredSegment(seg.id)}
                onMouseLeave={() => setHoveredSegment(null)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  isHovered
                    ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 shadow-xs'
                    : 'border-transparent hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {seg.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {seg.watts.toLocaleString()} W
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 min-w-[32px] text-right">
                      {seg.percentage}%
                    </span>
                  </div>
                </div>

                {/* Barra de progreso visual */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, seg.percentage)}%`,
                      backgroundColor: seg.color,
                    }}
                  />
                </div>

                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {seg.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
