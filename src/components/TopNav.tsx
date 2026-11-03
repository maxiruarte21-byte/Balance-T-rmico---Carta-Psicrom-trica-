import React from 'react';
import { Sun, Moon, Printer, FileText } from 'lucide-react';

export type MainTab = 'thermal' | 'psychrometric' | 'converter' | 'materials';

interface TopNavProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  isDark: boolean;
  onToggleDark: () => void;
  onOpenExport: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  isDark,
  onToggleDark,
  onOpenExport,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zona 1: Título de Marca (1 solo elemento de texto) */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
              ClimaThermal
            </span>
          </div>

          {/* Zona 2: 4 Pestañas Principales en Español (single-line whitespace-nowrap) */}
          <nav className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium overflow-x-auto py-1">
            <button
              type="button"
              onClick={() => onTabChange('thermal')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                activeTab === 'thermal'
                  ? 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Balance Térmico (Verano/Invierno)
            </button>

            <button
              type="button"
              onClick={() => onTabChange('psychrometric')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                activeTab === 'psychrometric'
                  ? 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Carta Psicrométrica y Confort
            </button>

            <button
              type="button"
              onClick={() => onTabChange('converter')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                activeTab === 'converter'
                  ? 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Conversor de Unidades
            </button>

            <button
              type="button"
              onClick={() => onTabChange('materials')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                activeTab === 'materials'
                  ? 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Base de Datos y Materiales
            </button>
          </nav>

          {/* Zona 3: 1 Acción Primaria (Exportar Resumen) + selector de tema */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleDark}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Cambiar tema de color"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              type="button"
              onClick={onOpenExport}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar Informe</span>
              <span className="sm:hidden">Informe</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
