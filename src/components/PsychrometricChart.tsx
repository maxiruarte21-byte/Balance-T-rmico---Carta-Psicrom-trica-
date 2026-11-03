import React, { useState, useRef, useMemo } from 'react';
import { PsychrometricState } from '../types';
import { 
  getWFromTempAndRh, 
  calculateSaturationVaporPressure, 
  calculateHumidityRatio,
} from '../utils/psychrometrics';

interface PsychrometricChartProps {
  currentState: PsychrometricState;
  outdoorState?: PsychrometricState;
  onSelectCoordinates?: (tempC: number, rhPercent: number) => void;
}

export const PsychrometricChart: React.FC<PsychrometricChartProps> = ({
  currentState,
  outdoorState,
  onSelectCoordinates,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Capas visibles
  const [showComfortZone, setShowComfortZone] = useState(true);
  const [showWetBulbLines, setShowWetBulbLines] = useState(true);
  const [showOutdoorPoint, setShowOutdoorPoint] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ tempC: number; wGKg: number; rh: number; x: number; y: number } | null>(null);

  // Límites del gráfico
  const minT = 0; // °C
  const maxT = 50; // °C
  const minW = 0; // g/kg
  const maxW = 30; // g/kg

  // Dimensiones SVG
  const svgWidth = 840;
  const svgHeight = 520;
  const padding = { top: 35, right: 70, bottom: 55, left: 60 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Transformaciones de coordenadas
  const toX = (tempC: number) => {
    return padding.left + ((tempC - minT) / (maxT - minT)) * plotWidth;
  };

  const toY = (wGKg: number) => {
    return padding.top + plotHeight - ((wGKg - minW) / (maxW - minW)) * plotHeight;
  };

  const fromX = (x: number) => {
    const raw = minT + ((x - padding.left) / plotWidth) * (maxT - minT);
    return Math.max(minT, Math.min(maxT, raw));
  };

  const fromY = (y: number) => {
    const raw = minW + ((padding.top + plotHeight - y) / plotHeight) * (maxW - minW);
    return Math.max(minW, Math.min(maxW, raw));
  };

  // Generar Curvas de Humedad Relativa (10% al 100%)
  const rhCurves = useMemo(() => {
    const rhValues = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const curves: { rh: number; path: string; labelPoint?: { x: number; y: number; text: string } }[] = [];

    rhValues.forEach((rh) => {
      const points: { x: number; y: number }[] = [];
      const step = 0.5;
      
      for (let t = minT; t <= maxT; t += step) {
        const w = getWFromTempAndRh(t, rh, currentState.pressureKPa);
        if (w <= maxW) {
          points.push({ x: toX(t), y: toY(w) });
        } else {
          const prevT = t - step;
          const prevW = getWFromTempAndRh(prevT, rh, currentState.pressureKPa);
          if (prevW < maxW) {
            const frac = (maxW - prevW) / (w - prevW);
            const interT = prevT + frac * step;
            points.push({ x: toX(interT), y: toY(maxW) });
          }
          break;
        }
      }

      if (points.length > 1) {
        const path = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');
        const labelCandidate = points.find(p => p.x >= toX(34)) || points[Math.floor(points.length * 0.75)];
        curves.push({
          rh,
          path,
          labelPoint: labelCandidate ? { x: labelCandidate.x, y: labelCandidate.y - 4, text: `${rh}%` } : undefined,
        });
      }
    });

    return curves;
  }, [currentState.pressureKPa]);

  // Líneas de Temperatura de Bulbo Húmedo (5°C a 30°C)
  const wetBulbLines = useMemo(() => {
    const twbList = [5, 10, 15, 20, 25, 30];
    return twbList.map((twb) => {
      const wSat = getWFromTempAndRh(twb, 100, currentState.pressureKPa);
      const startX = toX(twb);
      const startY = toY(Math.min(maxW, wSat));

      const wsKg = wSat / 1000;
      const tDry = twb + ((2501 - 2.326 * twb) * wsKg) / 1.006;
      const endX = toX(Math.min(maxT, tDry));
      const endY = toY(0);

      return {
        twb,
        x1: startX,
        y1: startY,
        x2: endX,
        y2: endY,
        labelX: startX - 8,
        labelY: startY - 4,
      };
    });
  }, [currentState.pressureKPa]);

  // Polígono de Confort Térmico ASHRAE 55
  const comfortZonePolygon = useMemo(() => {
    const tempStart = 20.0;
    const tempEnd = 26.0;
    const pts: { x: number; y: number }[] = [];

    // Curva inferior HR 30%
    for (let t = tempStart; t <= tempEnd; t += 0.5) {
      const w = getWFromTempAndRh(t, 30, currentState.pressureKPa);
      pts.push({ x: toX(t), y: toY(w) });
    }

    // Límite derecho a 26°C hasta HR 60% o rocío 16.8°C
    const wAt26Rh60 = getWFromTempAndRh(26, 60, currentState.pressureKPa);
    const maxComfortW = 12.0; // aprox. 16.8°C punto de rocío
    const wRightUpper = Math.min(wAt26Rh60, maxComfortW);
    pts.push({ x: toX(26), y: toY(wRightUpper) });

    // Curva superior HR 60% hacia 20°C
    for (let t = tempEnd; t >= tempStart; t -= 0.5) {
      const wRh60 = getWFromTempAndRh(t, 60, currentState.pressureKPa);
      const wBounded = Math.min(wRh60, maxComfortW);
      pts.push({ x: toX(t), y: toY(wBounded) });
    }

    if (pts.length > 0) {
      return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    }
    return '';
  }, [currentState.pressureKPa]);

  // Clic interactivo en el gráfico para posicionar estado
  const handleChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !onSelectCoordinates) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (clientX >= padding.left && clientX <= padding.left + plotWidth &&
        clientY >= padding.top && clientY <= padding.top + plotHeight) {
      const t = Math.round(fromX(clientX) * 10) / 10;
      const wG = fromY(clientY);
      
      const wKg = wG / 1000;
      const pws = calculateSaturationVaporPressure(t);
      const pw = (currentState.pressureKPa * wKg) / (0.62198 + wKg);
      const calcRh = Math.max(5, Math.min(100, Math.round((pw / pws) * 100)));
      
      onSelectCoordinates(t, calcRh);
    }
  };

  // Hover en el gráfico
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (clientX >= padding.left && clientX <= padding.left + plotWidth &&
        clientY >= padding.top && clientY <= padding.top + plotHeight) {
      const t = fromX(clientX);
      const wG = fromY(clientY);
      const wKg = wG / 1000;
      const pws = calculateSaturationVaporPressure(t);
      const pw = (currentState.pressureKPa * wKg) / (0.62198 + wKg);
      const rh = Math.max(0, Math.min(100, Math.round((pw / pws) * 100)));

      setHoveredPoint({
        tempC: Math.round(t * 10) / 10,
        wGKg: Math.round(wG * 10) / 10,
        rh,
        x: clientX,
        y: clientY,
      });
    } else {
      setHoveredPoint(null);
    }
  };

  const currentX = toX(currentState.dryBulbTempC);
  const currentY = toY(currentState.humidityRatioGKg);

  const outdoorX = outdoorState ? toX(outdoorState.dryBulbTempC) : null;
  const outdoorY = outdoorState ? toY(outdoorState.humidityRatioGKg) : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-colors space-y-4">
      {/* Cabecera del Gráfico */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Carta Psicrométrica (Diagrama de Carrier / Mollier)
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Patm: {currentState.pressureKPa.toFixed(2)} kPa
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Temperatura de bulbo seco vs. razón de humedad con zona de confort ASHRAE 55. Haz clic en el plano para mover el punto de estado.
          </p>
        </div>

        {/* Filtros de Capas */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowComfortZone(!showComfortZone)}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              showComfortZone 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' 
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Zona de Confort (ASHRAE)
          </button>

          <button
            type="button"
            onClick={() => setShowWetBulbLines(!showWetBulbLines)}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              showWetBulbLines 
                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-700' 
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Bulbo Húmedo (Twb)
          </button>

          {outdoorState && (
            <button
              type="button"
              onClick={() => setShowOutdoorPoint(!showOutdoorPoint)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                showOutdoorPoint 
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700' 
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Exterior vs Interior
            </button>
          )}
        </div>
      </div>

      {/* Contenedor del Lienzo SVG */}
      <div className="relative overflow-x-auto w-full bg-slate-50/50 dark:bg-slate-950/40 rounded-lg border border-slate-200/80 dark:border-slate-800 select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[700px] cursor-crosshair"
          onClick={handleChartClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="comfortGradEs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.15" />
            </linearGradient>

            <marker id="arrowEs" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284c7" />
            </marker>
          </defs>

          {/* Fondo del área de ploteo */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            className="fill-white dark:fill-slate-900"
          />

          {/* Rejilla: Temperatura de bulbo seco (verticales cada 5°C) */}
          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((t) => (
            <g key={`xgrid-es-${t}`}>
              <line
                x1={toX(t)}
                y1={padding.top}
                x2={toX(t)}
                y2={padding.top + plotHeight}
                stroke="currentColor"
                strokeWidth={t % 10 === 0 ? "1" : "0.5"}
                className={t % 10 === 0 ? "text-slate-300 dark:text-slate-700/80" : "text-slate-200 dark:text-slate-800/60"}
              />
              <text
                x={toX(t)}
                y={padding.top + plotHeight + 18}
                textAnchor="middle"
                className="text-[11px] font-mono fill-slate-500 dark:fill-slate-400"
              >
                {t}°
              </text>
            </g>
          ))}

          {/* Rejilla: Razón de humedad W (horizontales cada 5 g/kg) */}
          {[0, 5, 10, 15, 20, 25, 30].map((w) => (
            <g key={`ygrid-es-${w}`}>
              <line
                x1={padding.left}
                y1={toY(w)}
                x2={padding.left + plotWidth}
                y2={toY(w)}
                stroke="currentColor"
                strokeWidth={w % 10 === 0 ? "1" : "0.5"}
                className={w % 10 === 0 ? "text-slate-300 dark:text-slate-700/80" : "text-slate-200 dark:text-slate-800/60"}
              />
              <text
                x={padding.left + plotWidth + 8}
                y={toY(w) + 4}
                textAnchor="start"
                className="text-[11px] font-mono fill-slate-500 dark:fill-slate-400"
              >
                {w}
              </text>
            </g>
          ))}

          {/* Líneas de Bulbo Húmedo */}
          {showWetBulbLines && wetBulbLines.map((wb) => (
            <g key={`wb-es-${wb.twb}`}>
              <line
                x1={wb.x1}
                y1={wb.y1}
                x2={wb.x2}
                y2={wb.y2}
                stroke="#0284c7"
                strokeWidth="1"
                strokeDasharray="4 3"
                opacity="0.65"
              />
              <text
                x={wb.labelX}
                y={wb.labelY}
                textAnchor="end"
                className="text-[10px] font-mono fill-sky-600 dark:fill-sky-400"
              >
                {wb.twb}°C bh
              </text>
            </g>
          ))}

          {/* Polígono de Confort ASHRAE 55 */}
          {showComfortZone && comfortZonePolygon && (
            <g>
              <polygon
                points={comfortZonePolygon}
                fill="url(#comfortGradEs)"
                stroke="#059669"
                strokeWidth="1.5"
                strokeDasharray="3 2"
                className="transition-all"
              />
              <text
                x={toX(23)}
                y={toY(8)}
                textAnchor="middle"
                className="text-[11px] font-semibold fill-emerald-800 dark:fill-emerald-300 select-none pointer-events-none"
              >
                Zona de Confort
              </text>
              <text
                x={toX(23)}
                y={toY(6.5)}
                textAnchor="middle"
                className="text-[9.5px] fill-emerald-700 dark:fill-emerald-400 select-none pointer-events-none"
              >
                ASHRAE 55
              </text>
            </g>
          )}

          {/* Curvas de Humedad Relativa */}
          {rhCurves.map(({ rh, path, labelPoint }) => (
            <g key={`rh-es-${rh}`}>
              <path
                d={path}
                fill="none"
                stroke={rh === 100 ? '#0284c7' : '#94a3b8'}
                strokeWidth={rh === 100 ? '2' : rh % 20 === 0 ? '1.2' : '0.8'}
                opacity={rh === 100 ? '0.95' : '0.55'}
              />
              {labelPoint && (
                <text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  textAnchor="middle"
                  className={`text-[9px] font-mono select-none pointer-events-none ${
                    rh === 100 
                      ? 'fill-sky-700 dark:fill-sky-400 font-semibold' 
                      : 'fill-slate-500 dark:fill-slate-400'
                  }`}
                >
                  {labelPoint.text}
                </text>
              )}
            </g>
          ))}

          {/* Etiqueta de la curva de saturación (100% HR) */}
          <text
            x={toX(11)}
            y={toY(8.5) - 14}
            transform={`rotate(-40, ${toX(11)}, ${toY(8.5) - 14})`}
            className="text-[10px] font-semibold fill-sky-700 dark:fill-sky-400"
          >
            Línea de Saturación (100% HR)
          </text>

          {/* Proceso entre Exterior e Interior */}
          {showOutdoorPoint && outdoorX !== null && outdoorY !== null && (
            <g>
              <line
                x1={outdoorX}
                y1={outdoorY}
                x2={currentX}
                y2={currentY}
                stroke="#0284c7"
                strokeWidth="2"
                strokeDasharray="4 2"
                markerEnd="url(#arrowEs)"
                opacity="0.8"
              />
              <circle
                cx={outdoorX}
                cy={outdoorY}
                r="6"
                className="fill-amber-500 stroke-white dark:stroke-slate-900 stroke-2"
              />
              <text
                x={outdoorX}
                y={outdoorY - 10}
                textAnchor="middle"
                className="text-[11px] font-semibold fill-amber-600 dark:fill-amber-400"
              >
                Aire Exterior ({outdoorState?.dryBulbTempC}°C, {outdoorState?.relativeHumidity}%)
              </text>
            </g>
          )}

          {/* Guías de cruce del punto de estado */}
          <line
            x1={currentX}
            y1={currentY}
            x2={currentX}
            y2={padding.top + plotHeight}
            stroke="#0ea5e9"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
          <line
            x1={padding.left}
            y1={currentY}
            x2={padding.left + plotWidth}
            y2={currentY}
            stroke="#0ea5e9"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />

          {/* Marcador del estado actual */}
          <circle
            cx={currentX}
            cy={currentY}
            r="12"
            fill="#0ea5e9"
            opacity="0.25"
            className="animate-ping"
          />
          <circle
            cx={currentX}
            cy={currentY}
            r="6"
            className="fill-sky-600 stroke-white dark:stroke-slate-900 stroke-2 drop-shadow-md"
          />

          {/* Etiqueta del Punto de Estado */}
          <g transform={`translate(${currentX + 12}, ${currentY - 14})`}>
            <rect
              x="0"
              y="-12"
              width="145"
              height="38"
              rx="4"
              className="fill-slate-900/90 text-white"
            />
            <text x="6" y="2" className="text-[10px] font-medium fill-white">
              Estado: {currentState.dryBulbTempC}°C bs | {currentState.relativeHumidity}% HR
            </text>
            <text x="6" y="18" className="text-[9.5px] font-mono fill-sky-300">
              W: {currentState.humidityRatioGKg.toFixed(1)} g/kg | h: {currentState.specificEnthalpyKjKg.toFixed(1)} kJ
            </text>
          </g>

          {/* Tooltip interactivo flotante en hover */}
          {hoveredPoint && (
            <g transform={`translate(${Math.min(plotWidth - 40, hoveredPoint.x + 10)}, ${Math.max(padding.top + 20, hoveredPoint.y - 30)})`}>
              <rect
                x="0"
                y="0"
                width="115"
                height="44"
                rx="4"
                className="fill-slate-900 dark:fill-slate-800 stroke border-slate-700 opacity-95"
              />
              <text x="6" y="14" className="text-[10px] font-medium fill-slate-200">
                Tbs: {hoveredPoint.tempC}°C
              </text>
              <text x="6" y="27" className="text-[10px] font-mono fill-slate-300">
                W: {hoveredPoint.wGKg} g/kg
              </text>
              <text x="6" y="39" className="text-[9.5px] font-mono fill-sky-400">
                HR: {hoveredPoint.rh}%
              </text>
            </g>
          )}

          {/* Rótulos de los Ejes */}
          <text
            x={padding.left + plotWidth / 2}
            y={svgHeight - 12}
            textAnchor="middle"
            className="text-xs font-semibold fill-slate-700 dark:fill-slate-300"
          >
            Temperatura de Bulbo Seco (°C)
          </text>

          <text
            x={padding.left + plotWidth + 48}
            y={padding.top + plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(90, ${padding.left + plotWidth + 48}, ${padding.top + plotHeight / 2})`}
            className="text-xs font-semibold fill-slate-700 dark:fill-slate-300"
          >
            Razón de Humedad W (gramos de vapor / kg de aire seco)
          </text>

          {/* Marco exterior */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-slate-400 dark:text-slate-600"
          />
        </svg>
      </div>

      {/* Leyenda al pie */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span>
            Punto de Estado Evaluado
          </span>
          {outdoorState && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              Condición Exterior de Diseño
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500 inline-block"></span>
            Polígono Confort ASHRAE 55
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t border-sky-500 border-dashed inline-block"></span>
            Bulbo Húmedo
          </span>
        </div>
        <div className="text-[11px] font-mono">
          Haz clic en cualquier punto para actualizar los cálculos
        </div>
      </div>
    </div>
  );
};
