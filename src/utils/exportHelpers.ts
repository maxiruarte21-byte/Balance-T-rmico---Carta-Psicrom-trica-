import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { ThermalBalanceInputs, HeatLoadBreakdown, PsychrometricState, MaterialItem } from '../types';

/**
 * Genera y descarga un informe formal en PDF usando jsPDF
 */
export function exportToPdf(
  inputs: ThermalBalanceInputs,
  results: HeatLoadBreakdown,
  psychro?: PsychrometricState,
  materialsList?: MaterialItem[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isWinter = inputs.mode === 'winter';
  const primaryColor = isWinter ? [194, 65, 12] : [2, 132, 199]; // Amber o Sky Blue
  const darkTextColor = [15, 23, 42]; // Slate 900
  const mutedTextColor = [100, 116, 139]; // Slate 500

  // Encabezado
  doc.setFillColor(15, 23, 42); // slate-900 banner
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ClimaThermal Studio — Memoria de Cálculo', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(186, 230, 253);
  doc.text(
    `Informe de Balance Térmico (${isWinter ? 'Modo Invierno / Calefacción' : 'Modo Verano / Refrigeración'}) · Normas ASHRAE / IRAM`,
    14,
    21
  );

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(
    `Fecha: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
    170,
    13
  );

  let y = 38;

  // 1. Resumen Ejecutivo de Capacidad Recomendada
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 34, 2, 2, 'FD');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CAPACIDAD DE CLIMATIZACIÓN RECOMENDADA', 18, y + 7);

  doc.setFontSize(16);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(
    `${results.totalFrigoriasPerHour.toLocaleString()} ${isWinter ? 'Calorías/h' : 'Frigorías/h'}`,
    18,
    y + 17
  );

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `= ${results.totalWatts.toLocaleString()} Watts (${results.totalKilowatts} kW) · ${results.totalBtuPerHour.toLocaleString()} BTU/h · ${results.recommendedTonsRefrigeration} TR`,
    18,
    y + 24
  );

  doc.setFontSize(8.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(
    `Escalón comercial sugerido: ${results.recommendedCommercialFrigorias.toLocaleString()} ${isWinter ? 'Cal/h' : 'Frig/h'}  |  Caudal de aire impulsado: ${results.supplyAirflowM3h.toLocaleString()} m³/h (${results.supplyAirflowCfm.toLocaleString()} CFM)`,
    18,
    y + 30
  );

  y += 42;

  // 2. Parámetros del Proyecto y Geometría
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('1. Parámetros de Diseño y Geometría del Recinto', 14, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

  const calcArea = inputs.dimensions.length * inputs.dimensions.width;
  const calcVol = calcArea * inputs.dimensions.height;

  const facilityLabels: Record<string, string> = {
    commercial_kiosk: 'Kiosco / Local Comercial',
    residential: 'Casa / Residencial',
    office: 'Oficina Corporativa',
    restaurant: 'Restaurante / Cafetería',
    auditorium: 'Auditorio / Cine',
    fitness_gym: 'Gimnasio / Fitness',
  };

  const col1 = [
    `Tipo de Recinto: ${facilityLabels[inputs.facilityType] || inputs.facilityType}`,
    `Dimensiones: ${inputs.dimensions.length}m (Largo) × ${inputs.dimensions.width}m (Ancho) × ${inputs.dimensions.height}m (Alto)`,
    `Superficie en Planta: ${(inputs.dimensions.customArea ?? calcArea).toFixed(1)} m²`,
    `Volumen del Recinto: ${(inputs.dimensions.customVolume ?? calcVol).toFixed(1)} m³`,
    `Superficie Vidriada: ${Math.round(inputs.envelope.windowToWallRatio * 100)}% de los muros`,
  ];

  const col2 = [
    `Temperatura Exterior: ${inputs.designConditions.outdoorTempC} °C | HR: ${inputs.designConditions.outdoorRh}%`,
    `Set-point Interior: ${inputs.designConditions.indoorTempC} °C | HR: ${inputs.designConditions.indoorRh}%`,
    `Hora Pico de Diseño: ${inputs.simulation?.designHour ?? 15}:00 hs`,
    `Orientación Principal Ventanas: ${inputs.envelope.orientation}`,
    `Margen de Seguridad: +${(inputs.safetyFactor * 100).toFixed(0)}%`,
  ];

  col1.forEach((txt, idx) => {
    doc.text(`• ${txt}`, 16, y + idx * 5.2);
  });

  col2.forEach((txt, idx) => {
    doc.text(`• ${txt}`, 110, y + idx * 5.2);
  });

  y += 32;

  // 3. Tabla Desglose de Cargas Térmicas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. Desglose Detallado de Cargas Térmicas (Watts)', 14, y);

  y += 5;
  // Encabezado de la tabla
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Componente de Carga Térmica', 18, y + 4.8);
  doc.text('Tipo', 115, y + 4.8);
  doc.text('Potencia (Watts)', 150, y + 4.8);
  doc.text('% Total', 180, y + 4.8);

  y += 7;
  const loadRows = [
    { name: 'Transmisión por Muros Exteriores', type: 'Sensible', w: results.envelopeWalls },
    { name: 'Transmisión por Techo / Cubierta', type: 'Sensible', w: results.envelopeRoof },
    { name: 'Conducción a través de Vidrios', type: 'Sensible', w: results.envelopeWindowsCond },
    { name: 'Radiación Solar Directa en Cristales', type: 'Sensible', w: results.solarRadiation },
    { name: 'Metabolismo de Ocupantes', type: 'Sens + Lat', w: results.occupantsSensible + results.occupantsLatent },
    { name: 'Iluminación Artificial', type: 'Sensible', w: results.lighting },
    { name: 'Equipos y Heladeras Comerciales', type: 'Sensible', w: results.appliances },
    { name: 'Renovación y Ventilación de Aire', type: 'Sens + Lat', w: results.ventilationSensible + results.ventilationLatent },
  ];

  const totalSub = Math.max(1, results.totalLoadSubtotal);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

  loadRows.forEach((row, i) => {
    const rowY = y + i * 5.5;
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, rowY - 1, 182, 5.5, 'F');
    }
    const pct = Math.round((row.w / totalSub) * 100);
    doc.text(row.name, 18, rowY + 3);
    doc.text(row.type, 115, rowY + 3);
    doc.text(`${row.w.toLocaleString()} W`, 150, rowY + 3);
    doc.text(`${pct}%`, 182, rowY + 3);
  });

  y += loadRows.length * 5.5 + 4;

  // Fila Total
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(224, 242, 254);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('TOTAL REQUERIDO CON MARGEN DE SEGURIDAD', 18, y + 4.8);
  doc.text(`${results.totalWatts.toLocaleString()} W`, 150, y + 4.8);
  doc.text('100%', 182, y + 4.8);

  y += 14;

  // 4. Psicrometría y Confort si está disponible
  if (psychro) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. Análisis Psicrométrico del Aire y Confort (ASHRAE 55)', 14, y);

    y += 6;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, 182, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Diagnóstico: ${psychro.comfortTitle}`, 18, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    const splitAdvice = doc.splitTextToSize(psychro.comfortAdvice, 174);
    doc.text(splitAdvice, 18, y + 11);

    doc.setFontSize(7.5);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(
      `Tbs: ${psychro.dryBulbTempC}°C | Tbh: ${psychro.wetBulbTempC.toFixed(1)}°C | Tpr: ${psychro.dewPointTempC.toFixed(1)}°C | HR: ${psychro.relativeHumidity}% | W: ${psychro.humidityRatioGKg.toFixed(2)} g/kg | Entalpía: ${psychro.specificEnthalpyKjKg.toFixed(1)} kJ/kg | Vol. Esp: ${psychro.specificVolumeM3Kg.toFixed(3)} m³/kg`,
      18,
      y + 20
    );
  }

  // Pie de página formal
  doc.setFontSize(7.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('Documento generado automáticamente por ClimaThermal Studio — Ingeniería Termomecánica', 14, 287);
  doc.text('Página 1 de 1', 185, 287);

  // Descargar archivo
  const filename = `Balance_Termico_${isWinter ? 'Invierno' : 'Verano'}_${inputs.facilityType}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * Genera y descarga un libro de cálculo en Excel (.xlsx) usando SheetJS (XLSX)
 */
export function exportToExcel(
  inputs: ThermalBalanceInputs,
  results: HeatLoadBreakdown,
  psychro?: PsychrometricState
) {
  const isWinter = inputs.mode === 'winter';
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen de Balance Térmico
  const calcArea = inputs.dimensions.length * inputs.dimensions.width;
  const calcVol = calcArea * inputs.dimensions.height;

  const summaryData = [
    ['CLIMATHERMAL STUDIO — MEMORIA DE CÁLCULO DE BALANCE TÉRMICO', ''],
    ['Fecha de Generación', new Date().toLocaleDateString('es-ES')],
    ['Modo de Temporada', isWinter ? 'Invierno (Calefacción)' : 'Verano (Refrigeración)'],
    ['Tipo de Recinto', inputs.facilityType],
    ['', ''],
    ['1. DIMENSIONES Y SUPERFICIES', ''],
    ['Largo (m)', inputs.dimensions.length],
    ['Ancho (m)', inputs.dimensions.width],
    ['Altura de Techo (m)', inputs.dimensions.height],
    ['Superficie en Planta (m²)', inputs.dimensions.customArea ?? calcArea],
    ['Volumen del Recinto (m³)', inputs.dimensions.customVolume ?? calcVol],
    ['Fracción de Aberturas Vidriadas (%)', `${Math.round(inputs.envelope.windowToWallRatio * 100)}%`],
    ['', ''],
    ['2. CONDICIONES CLIMÁTICAS DE DISEÑO', ''],
    ['Temperatura Exterior (°C)', inputs.designConditions.outdoorTempC],
    ['Humedad Relativa Exterior (%)', inputs.designConditions.outdoorRh],
    ['Temperatura Interior Set-point (°C)', inputs.designConditions.indoorTempC],
    ['Humedad Relativa Interior (%)', inputs.designConditions.indoorRh],
    ['Hora Pico de Diseño', `${inputs.simulation?.designHour ?? 15}:00 hs`],
    ['Orientación Cardinal Vidrios', inputs.envelope.orientation],
    ['Margen de Seguridad de Diseño', `${(inputs.safetyFactor * 100).toFixed(0)}%`],
    ['', ''],
    ['3. RESULTADOS DE CAPACIDAD DE CLIMATIZACIÓN', ''],
    ['Carga Térmica Total en Watts (W)', results.totalWatts],
    ['Potencia Térmica en Kilowatts (kW)', results.totalKilowatts],
    [isWinter ? 'Demanda Calefacción (Calorías/h)' : 'Frigorías / hora (Frig/h)', results.totalFrigoriasPerHour],
    ['Capacidad en BTU / hora', results.totalBtuPerHour],
    ['Toneladas de Refrigeración (TR)', results.recommendedTonsRefrigeration],
    ['Escalón Comercial Recomendado (Frig/h)', results.recommendedCommercialFrigorias],
    ['Caudal de Aire Necesario (m³/h)', results.supplyAirflowM3h],
    ['Caudal de Aire en CFM', results.supplyAirflowCfm],
    ['Factor de Calor Sensible (SHR)', results.sensibleHeatRatio],
    ['', ''],
    ['4. DESGLOSE DE CARGAS TÉRMICAS (WATTS)', ''],
    ['Pérdida/Ganancia Muros Exteriores (W)', results.envelopeWalls],
    ['Pérdida/Ganancia Techo / Cubierta (W)', results.envelopeRoof],
    ['Conducción en Vidrios (W)', results.envelopeWindowsCond],
    ['Radiación Solar Directa en Cristales (W)', results.solarRadiation],
    ['Metabolismo Sensible de Ocupantes (W)', results.occupantsSensible],
    ['Metabolismo Latente de Ocupantes (W)', results.occupantsLatent],
    ['Carga por Iluminación (W)', results.lighting],
    ['Carga por Equipos y Heladeras (W)', results.appliances],
    ['Ventilación Sensible (W)', results.ventilationSensible],
    ['Ventilación Latente (W)', results.ventilationLatent],
    ['Subtotal Cargas Térmicas (W)', results.totalLoadSubtotal],
    ['Margen de Sobredimensionamiento (W)', results.safetyMarginLoad],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Balance_Termico');

  // Hoja 2: Equipos y Heladeras
  const appliancesData = [
    ['LISTADO DE EQUIPOS Y ELECTRODOMÉSTICOS DISIPADORES DE CALOR', '', '', ''],
    ['Nombre del Equipo', 'Cantidad', 'Potencia Unitaria (W)', 'Aporte Total (W)'],
    ...inputs.appliances.map(app => [
      app.name,
      app.quantity,
      app.wattsPerUnit,
      app.quantity * app.wattsPerUnit,
    ]),
    ['', '', 'TOTAL EQUIPOS (W):', results.appliances],
  ];

  const wsAppliances = XLSX.utils.aoa_to_sheet(appliancesData);
  XLSX.utils.book_append_sheet(wb, wsAppliances, 'Equipos_Heladeras');

  // Hoja 3: Psicrometría
  if (psychro) {
    const psychroData = [
      ['ANÁLISIS PSICROMÉTRICO Y CONFORT (ASHRAE 55)', ''],
      ['Estado de Confort', psychro.comfortTitle],
      ['Diagnóstico Técnico', psychro.comfortAdvice],
      ['', ''],
      ['PROPIEDAD TERMODINÁMICA', 'VALOR'],
      ['Temperatura de Bulbo Seco (°C)', psychro.dryBulbTempC],
      ['Temperatura de Bulbo Húmedo (°C)', +psychro.wetBulbTempC.toFixed(2)],
      ['Punto de Rocío (°C)', +psychro.dewPointTempC.toFixed(2)],
      ['Humedad Relativa (%)', psychro.relativeHumidity],
      ['Razón de Humedad W (g vapor / kg aire seco)', +psychro.humidityRatioGKg.toFixed(3)],
      ['Entalpía Específica (kJ/kg)', +psychro.specificEnthalpyKjKg.toFixed(2)],
      ['Volumen Específico (m³/kg)', +psychro.specificVolumeM3Kg.toFixed(4)],
      ['Densidad del Aire Húmedo (kg/m³)', +psychro.densityKgM3.toFixed(4)],
      ['Presión Barométrica (kPa)', +psychro.pressureKPa.toFixed(2)],
    ];
    const wsPsychro = XLSX.utils.aoa_to_sheet(psychroData);
    XLSX.utils.book_append_sheet(wb, wsPsychro, 'Psicrometria');
  }

  const filename = `Balance_Termico_${isWinter ? 'Invierno' : 'Verano'}_${inputs.facilityType}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
