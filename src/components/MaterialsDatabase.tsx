import React, { useState } from 'react';
import { MaterialItem } from '../types';
import { 
  Database, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  RotateCcw, 
  Check, 
  X, 
  Info,
  BookOpen,
  Layers
} from 'lucide-react';
import { DEFAULT_MATERIALS } from '../utils/materialsDb';

interface MaterialsDatabaseProps {
  materials: MaterialItem[];
  onUpdateMaterials: (materials: MaterialItem[]) => void;
  onSelectForThermal?: (material: MaterialItem) => void;
}

export const MaterialsDatabase: React.FC<MaterialsDatabaseProps> = ({
  materials,
  onUpdateMaterials,
  onSelectForThermal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'wall' | 'roof' | 'window'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUValue, setEditUValue] = useState<number>(1.5);
  const [editDesc, setEditDesc] = useState<string>('');

  // Formulario para nuevo material
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'wall' | 'roof' | 'window'>('wall');
  const [newUValue, setNewUValue] = useState<number>(0.85);
  const [newShgc, setNewShgc] = useState<number>(0.65);
  const [newStandard, setNewStandard] = useState('IRAM 11605 / Personalizado');
  const [newDesc, setNewDesc] = useState('');

  // Filtrado
  const filteredMaterials = materials.filter((m) => {
    const matchCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.standard.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleStartEdit = (mat: MaterialItem) => {
    setEditingId(mat.id);
    setEditUValue(mat.uValue);
    setEditDesc(mat.desc);
  };

  const handleSaveEdit = (id: string) => {
    const updated = materials.map((m) => {
      if (m.id === id) {
        return {
          ...m,
          uValue: Math.max(0.05, editUValue),
          desc: editDesc.trim() || m.desc,
        };
      }
      return m;
    });
    onUpdateMaterials(updated);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDeleteCustom = (id: string) => {
    if (confirm('¿Deseas eliminar este material personalizado?')) {
      const updated = materials.filter((m) => m.id !== id);
      onUpdateMaterials(updated);
    }
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMat: MaterialItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: newName.trim(),
      category: newCategory,
      uValue: Math.max(0.05, newUValue),
      shgc: newCategory === 'window' ? Math.max(0.1, Math.min(1.0, newShgc)) : undefined,
      standard: newStandard.trim() || 'IRAM 11605 / ASHRAE',
      desc: newDesc.trim() || 'Material personalizado agregado por el usuario.',
      isCustom: true,
    };

    onUpdateMaterials([newMat, ...materials]);
    setIsAddingNew(false);
    setNewName('');
    setNewDesc('');
    setNewUValue(0.85);
  };

  const handleResetDefaults = () => {
    if (confirm('¿Restablecer toda la base de datos a los valores originales de las normas IRAM 11605 y ASHRAE 90.1?')) {
      onUpdateMaterials(DEFAULT_MATERIALS);
    }
  };

  const getCategoryBadge = (cat: 'wall' | 'roof' | 'window') => {
    switch (cat) {
      case 'wall':
        return <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">Muro</span>;
      case 'roof':
        return <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">Techo</span>;
      case 'window':
        return <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">Vidrio</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 text-white dark:bg-slate-900/90 border border-slate-800 shadow-md">
        <div>
          <span className="text-xs text-sky-400 font-mono tracking-wide uppercase">
            Normas IRAM 11605, 11507 y ASHRAE 90.1
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
            Base de Datos de Materiales y Transmitancia Térmica (U)
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Consulta, edita o agrega materiales para muros, cubiertas y aberturas vidriadas con sus coeficientes de transmitancia térmica $U$ [W/(m²·K)]. Los cambios se reflejan inmediatamente en la calculadora de Balance Térmico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Material</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700 flex items-center gap-1"
            title="Restablecer valores originales IRAM / ASHRAE"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>
        </div>
      </div>

      {/* Formulario Modal / Drawer para Nuevo Material */}
      {isAddingNew && (
        <form onSubmit={handleCreateNew} className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-500" />
              Agregar Nuevo Material Personalizado
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label htmlFor="new-mat-name" className="text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                Nombre del Material
              </label>
              <input
                id="new-mat-name"
                type="text"
                placeholder="ej. Muro Steel Frame con EPS 80mm"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="new-mat-category" className="text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                Categoría Constructiva
              </label>
              <select
                id="new-mat-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="wall">Muro (Pared Exterior)</option>
                <option value="roof">Techo (Cubierta)</option>
                <option value="window">Vidrio / Abertura</option>
              </select>
            </div>

            <div>
              <label htmlFor="new-mat-u" className="text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                Transmitancia U [W/(m²·K)]
              </label>
              <input
                id="new-mat-u"
                type="number"
                step="0.05"
                min="0.05"
                max="8.0"
                required
                value={newUValue}
                onChange={(e) => setNewUValue(parseFloat(e.target.value) || 0.1)}
                className="w-full px-3 py-1.5 font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            {newCategory === 'window' ? (
              <div>
                <label htmlFor="new-mat-shgc" className="text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                  Coef. Control Solar (SHGC)
                </label>
                <input
                  id="new-mat-shgc"
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="0.9"
                  value={newShgc}
                  onChange={(e) => setNewShgc(parseFloat(e.target.value) || 0.7)}
                  className="w-full px-3 py-1.5 font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="new-mat-std" className="text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                  Norma o Fabricante
                </label>
                <input
                  id="new-mat-std"
                  type="text"
                  placeholder="ej. IRAM 11605 / Catálogo"
                  value={newStandard}
                  onChange={(e) => setNewStandard(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="new-mat-desc" className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">
              Descripción y Composición de Capas
            </label>
            <input
              id="new-mat-desc"
              type="text"
              placeholder="Detalle de espesores y aislantes térmicos..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-3 py-1.5 text-xs rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
            >
              Guardar Material
            </button>
          </div>
        </form>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filtro por Categorías */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
          {[
            { id: 'all', label: 'Todos los Materiales' },
            { id: 'wall', label: 'Muros' },
            { id: 'roof', label: 'Techos' },
            { id: 'window', label: 'Vidrios' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, norma o capa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Tabla de Materiales */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-24">Categoría</th>
                <th className="py-3 px-4">Material / Elemento Constructivo</th>
                <th className="py-3 px-4 w-32 text-right">Transmitancia U</th>
                <th className="py-3 px-4 w-44">Norma de Referencia</th>
                <th className="py-3 px-4 w-24 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    No se encontraron materiales que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((mat) => {
                  const isEditing = editingId === mat.id;
                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        {getCategoryBadge(mat.category)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{mat.name}</span>
                          {mat.isCustom && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono">
                              Personalizado
                            </span>
                          )}
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="mt-1 w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                          />
                        ) : (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {mat.desc}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.05"
                            min="0.05"
                            value={editUValue}
                            onChange={(e) => setEditUValue(parseFloat(e.target.value) || 0.1)}
                            className="w-20 text-right px-1.5 py-0.5 rounded border border-sky-500 bg-white dark:bg-slate-800 font-bold text-sky-600"
                          />
                        ) : (
                          <span className="font-bold text-sky-600 dark:text-sky-400 text-sm">
                            {mat.uValue.toFixed(2)}{' '}
                            <span className="text-[10px] font-normal text-slate-400">W/m²K</span>
                          </span>
                        )}
                        {mat.shgc && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            SHGC: {mat.shgc}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        {mat.standard}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(mat.id)}
                              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                              title="Guardar cambios"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="p-1 rounded text-slate-400 hover:text-slate-600"
                              title="Cancelar edición"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(mat)}
                              className="p-1 rounded text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Editar coeficiente U"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {mat.isCustom && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCustom(mat.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Eliminar material"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota técnica de referencia normativa */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-sky-500" />
          Referencia Normativa de Transmitancia Térmica
        </div>
        <p className="text-[11px] leading-relaxed">
          Los valores de transmitancia térmica ($U$, en $W/(m^2\cdot K)$) indican el flujo de calor que atraviesa un elemento por cada metro cuadrado y grado de diferencia de temperatura. Cuanto menor es el valor de $U$, mayor es la resistencia térmica y la eficiencia energética del cerramiento.
        </p>
      </div>
    </div>
  );
};
