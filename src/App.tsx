/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopNav, MainTab } from './components/TopNav';
import { ThermalBalanceCalculator } from './components/ThermalBalanceCalculator';
import { UnitConverter } from './components/UnitConverter';
import { PsychrometricComfort } from './components/PsychrometricComfort';
import { MaterialsDatabase } from './components/MaterialsDatabase';
import { ExportReportModal } from './components/ExportReportModal';
import { calculateHeatLoads } from './utils/thermalCalculations';
import { computePsychrometricState } from './utils/psychrometrics';
import { FACILITY_DEFAULTS } from './utils/constants';
import { ThermalBalanceInputs, MaterialItem } from './types';
import { getStoredMaterials, saveMaterialsToStorage } from './utils/materialsDb';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('thermal');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Base de datos de materiales reactiva y persistida en localStorage
  const [materials, setMaterials] = useState<MaterialItem[]>(() => getStoredMaterials());

  const handleUpdateMaterials = (updated: MaterialItem[]) => {
    setMaterials(updated);
    saveMaterialsToStorage(updated);
  };

  // Estado psicrométrico sincronizado
  const [syncedConditions, setSyncedConditions] = useState<{
    indoorTempC: number;
    indoorRh: number;
    outdoorTempC: number;
    outdoorRh: number;
  }>({
    indoorTempC: 23.0,
    indoorRh: 50.0,
    outdoorTempC: 36.0,
    outdoorRh: 45.0,
  });

  // Detección inicial del modo oscuro
  useEffect(() => {
    const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isSystemDark) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleToggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const handleNavigateToPsychrometric = (
    indoorTemp: number, 
    indoorRh: number, 
    outdoorTemp: number, 
    outdoorRh: number
  ) => {
    setSyncedConditions({
      indoorTempC: indoorTemp,
      indoorRh: indoorRh,
      outdoorTempC: outdoorTemp,
      outdoorRh: outdoorRh,
    });
    setActiveTab('psychrometric');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToConverter = () => {
    setActiveTab('converter');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToMaterials = () => {
    setActiveTab('materials');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Datos para el reporte modal
  const defaultReportInputs = {
    ...FACILITY_DEFAULTS.commercial_kiosk,
    mode: 'summer' as const,
    facilityType: 'commercial_kiosk' as const,
    dimensions: FACILITY_DEFAULTS.commercial_kiosk.dimensions!,
    envelope: {
      wallMaterialId: 'wall_sandwich_pur_80',
      roofMaterialId: 'roof_metal_sandwich_pur',
      windowMaterialId: 'window_single_clear',
      windowToWallRatio: 0.35,
      orientation: 'W' as const,
      shading: 'none' as const,
    },
    occupancy: FACILITY_DEFAULTS.commercial_kiosk.occupancy!,
    lighting: {
      fixtureType: 'led' as const,
      quantity: 8,
      wattsPerFixture: 25,
      usageFactor: 0.9,
    },
    appliances: FACILITY_DEFAULTS.commercial_kiosk.appliances!,
    simulation: {
      designHour: 15,
    },
    ventilation: {
      method: 'ach' as const,
      ach: 1.5,
      litersPerSecondPerPerson: 10,
    },
    designConditions: FACILITY_DEFAULTS.commercial_kiosk.designConditions!,
    safetyFactor: FACILITY_DEFAULTS.commercial_kiosk.safetyFactor ?? 0.15,
  } as ThermalBalanceInputs;

  const currentLoads = calculateHeatLoads(defaultReportInputs, materials);
  const currentPsychro = computePsychrometricState(
    syncedConditions.indoorTempC, 
    syncedConditions.indoorRh, 
    101.325, 
    0
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Barra de Navegación Superior con 4 Pestañas */}
      <TopNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isDark={isDark}
        onToggleDark={handleToggleDark}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'thermal' && (
          <ThermalBalanceCalculator
            materialsList={materials}
            psychroState={currentPsychro}
            onNavigateToPsychrometric={handleNavigateToPsychrometric}
            onNavigateToMaterials={handleNavigateToMaterials}
            onNavigateToConverter={handleNavigateToConverter}
          />
        )}

        {activeTab === 'psychrometric' && (
          <PsychrometricComfort
            initialTempC={syncedConditions.indoorTempC}
            initialRh={syncedConditions.indoorRh}
            outdoorTempC={syncedConditions.outdoorTempC}
            outdoorRh={syncedConditions.outdoorRh}
          />
        )}

        {activeTab === 'converter' && (
          <UnitConverter />
        )}

        {activeTab === 'materials' && (
          <MaterialsDatabase
            materials={materials}
            onUpdateMaterials={handleUpdateMaterials}
          />
        )}
      </main>

      {/* Pie de Página de Ingeniería */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">ClimaThermal Studio</span>
            <span aria-hidden="true">·</span>
            <span>Cálculo Termodinámico de Climatización y Confort (Normas ASHRAE e IRAM)</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>1 TR = 3.024 Frig/h = 12.000 BTU/h</span>
            <span aria-hidden="true">·</span>
            <span>1 Frig/h = 1,163 W</span>
            <span aria-hidden="true">·</span>
            <span>Patm = 101,325 kPa</span>
          </div>
        </div>
      </footer>

      {/* Modal de Informe Técnico para Imprimir / Guardar en PDF */}
      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        inputs={defaultReportInputs}
        results={currentLoads}
        psychrometricState={currentPsychro}
      />
    </div>
  );
}
