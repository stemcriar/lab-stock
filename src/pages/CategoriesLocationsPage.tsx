import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Category, LabLocation } from '../types/inventory';
import {
  FolderTree,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Tag,
  Boxes,
  Layers,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-react';

export const CategoriesLocationsPage: React.FC = () => {
  const { showToast } = useToast();
  const {
    items,
    categories,
    locations,
    addCategory,
    updateCategory,
    deleteCategory,
    addLocation,
    updateLocation,
    deleteLocation,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'categories' | 'locations'>('categories');

  // Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catSubInput, setCatSubInput] = useState('');
  const [catSubcategories, setCatSubcategories] = useState<string[]>([]);
  const [catColor, setCatColor] = useState('#7c3aed');

  // Location Modal State
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LabLocation | null>(null);
  const [locSala, setLocSala] = useState('');
  const [locArmarios, setLocArmarios] = useState<{ nome: string; prateleiras: string[] }[]>([]);
  const [newArmarioName, setNewArmarioName] = useState('');

  // Delete Confirmation State
  const [deleteCatTarget, setDeleteCatTarget] = useState<Category | null>(null);
  const [deleteLocTarget, setDeleteLocTarget] = useState<LabLocation | null>(null);

  const handleOpenCatModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.nome);
      setCatDesc(cat.descricao || '');
      setCatSubcategories(cat.subcategorias || []);
      setCatColor(cat.cor || '#7c3aed');
    } else {
      setEditingCategory(null);
      setCatName('');
      setCatDesc('');
      setCatSubcategories([]);
      setCatColor('#7c3aed');
    }
    setCatSubInput('');
    setCategoryModalOpen(true);
  };

  const handleAddSubcategory = () => {
    if (catSubInput.trim() && !catSubcategories.includes(catSubInput.trim())) {
      setCatSubcategories([...catSubcategories, catSubInput.trim()]);
      setCatSubInput('');
    }
  };

  const handleRemoveSubcategory = (sub: string) => {
    setCatSubcategories(catSubcategories.filter((s) => s !== sub));
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showToast('Nome obrigatório', 'Informe o nome da categoria.', 'warning');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          nome: catName.trim(),
          descricao: catDesc.trim() || undefined,
          subcategorias: catSubcategories,
          cor: catColor,
        });
        showToast('Categoria atualizada!', `A categoria "${catName}" foi salva com sucesso no servidor.`, 'success');
      } else {
        await addCategory({
          nome: catName.trim(),
          descricao: catDesc.trim() || undefined,
          subcategorias: catSubcategories,
          cor: catColor,
        });
        showToast('Categoria criada!', `A nova categoria "${catName}" foi cadastrada no servidor.`, 'success');
      }
      setCategoryModalOpen(false);
    } catch (err: any) {
      showToast('Erro ao salvar categoria', err.message || 'Falha ao salvar no SQLite.', 'error');
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    try {
      const result = await deleteCategory(cat.id);
      if (result.success) {
        showToast('Categoria removida', `A categoria "${cat.nome}" foi excluída do servidor.`, 'info');
        setDeleteCatTarget(null);
      } else {
        showToast('Ação bloqueada', result.message || 'Erro ao excluir categoria.', 'error');
      }
    } catch (err: any) {
      showToast('Erro ao excluir', err.message || 'Falha ao comunicar com o servidor.', 'error');
    }
  };

  const handleOpenLocModal = (loc?: LabLocation) => {
    if (loc) {
      setEditingLocation(loc);
      setLocSala(loc.sala);
      setLocArmarios(loc.armarios || []);
    } else {
      setEditingLocation(null);
      setLocSala('');
      setLocArmarios([
        { nome: 'Armário A', prateleiras: ['Prateleira 1', 'Prateleira 2', 'Prateleira 3'] },
      ]);
    }
    setNewArmarioName('');
    setLocationModalOpen(true);
  };

  const handleAddArmario = () => {
    if (newArmarioName.trim()) {
      setLocArmarios([
        ...locArmarios,
        {
          nome: newArmarioName.trim(),
          prateleiras: ['Prateleira 1', 'Prateleira 2', 'Prateleira 3'],
        },
      ]);
      setNewArmarioName('');
    }
  };

  const handleRemoveArmario = (index: number) => {
    setLocArmarios(locArmarios.filter((_, i) => i !== index));
  };

  const handleAddShelfToArmario = (armarioIndex: number, shelfName: string) => {
    if (!shelfName.trim()) return;
    const updated = [...locArmarios];
    if (!updated[armarioIndex].prateleiras.includes(shelfName.trim())) {
      updated[armarioIndex].prateleiras.push(shelfName.trim());
      setLocArmarios(updated);
    }
  };

  const handleRemoveShelfFromArmario = (armarioIndex: number, shelfIndex: number) => {
    const updated = [...locArmarios];
    updated[armarioIndex].prateleiras = updated[armarioIndex].prateleiras.filter((_, i) => i !== shelfIndex);
    setLocArmarios(updated);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locSala.trim()) {
      showToast('Sala obrigatória', 'Informe o nome da sala / setor do laboratório.', 'warning');
      return;
    }

    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, {
          sala: locSala.trim(),
          armarios: locArmarios,
        });
        showToast('Localização salva!', `O setor "${locSala}" foi atualizado com sucesso no servidor.`, 'success');
      } else {
        await addLocation({
          sala: locSala.trim(),
          armarios: locArmarios,
        });
        showToast('Localização criada!', `O setor "${locSala}" foi registrado no servidor.`, 'success');
      }
      setLocationModalOpen(false);
    } catch (err: any) {
      showToast('Erro ao salvar local', err.message || 'Falha ao salvar no SQLite.', 'error');
    }
  };

  const handleDeleteLocation = async (loc: LabLocation) => {
    try {
      await deleteLocation(loc.id);
      showToast('Localização excluída', `A sala "${loc.sala}" foi removida do sistema.`, 'info');
      setDeleteLocTarget(null);
    } catch (err: any) {
      showToast('Erro ao excluir', err.message || 'Falha ao comunicar com o servidor.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Categorias & Localizações <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">STEM CRIAR</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerencie os grupos de materiais e a estrutura física de armazenamento do laboratório
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {activeTab === 'categories' ? (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4 text-amber-300" />}
              onClick={() => handleOpenCatModal()}
            >
              Nova Categoria
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4 text-amber-300" />}
              onClick={() => handleOpenLocModal()}
            >
              Nova Sala / Local
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-8">
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'categories'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Categorias & Subcategorias ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('locations')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'locations'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Salas, Armários & Prateleiras ({locations.length})</span>
        </button>
      </div>

      {/* TAB 1: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const linkedItems = items.filter((i) => i.categoria === cat.nome);
            const totalQty = linkedItems.reduce((acc, i) => acc + i.quantidadeAtual, 0);

            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:border-purple-200 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs border border-white/20"
                        style={{ backgroundColor: cat.cor || '#7c3aed' }}
                      >
                        <FolderTree className="w-5 h-5 text-amber-300" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{cat.nome}</h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {linkedItems.length} {linkedItems.length === 1 ? 'item cadastrado' : 'itens cadastrados'} ({totalQty} físicos)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenCatModal(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                        title="Editar categoria"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteCatTarget(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Excluir categoria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {cat.descricao && (
                    <p className="text-xs text-slate-600 leading-relaxed">{cat.descricao}</p>
                  )}

                  {/* Subcategories */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Subcategorias ({cat.subcategorias.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cat.subcategorias.length > 0 ? (
                        cat.subcategorias.map((sub) => (
                          <span
                            key={sub}
                            className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-semibold border border-purple-200/60"
                          >
                            {sub}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Nenhuma subcategoria vinculada</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono text-[10px] text-slate-400">{cat.id}</span>
                  <span className="text-purple-600 font-bold cursor-pointer hover:underline">
                    Ver materiais →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: LOCATIONS */}
      {activeTab === 'locations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map((loc) => {
            const locItems = items.filter((i) => i.localizacao.sala === loc.sala);

            return (
              <div
                key={loc.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:border-purple-200 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{loc.sala}</h4>
                        <span className="text-[11px] text-slate-500">
                          {locItems.length} materiais armazenados aqui
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenLocModal(loc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                        title="Editar localização"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteLocTarget(loc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Excluir localização"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Cabinets & Shelves List */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Armários & Bancadas ({loc.armarios.length})
                    </span>
                    <div className="space-y-2">
                      {loc.armarios.map((arm, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5"
                        >
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                            <span>{arm.nome}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 pl-3">
                            {arm.prateleiras.map((prat, pIdx) => (
                              <span
                                key={pIdx}
                                className="px-2 py-0.5 rounded-md bg-white text-slate-700 text-[10px] border border-slate-200"
                              >
                                {prat}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>{loc.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Create/Edit Modal */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title={editingCategory ? 'Editar Categoria' : 'Nova Categoria de Estoque'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nome da Categoria *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Sensores & Robótica"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Descrição do Grupo
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Itens para prototipagem e desenvolvimento de projetos..."
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Cor do Ícone / Destaque
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={catColor}
                onChange={(e) => setCatColor(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-1"
              />
              <span className="text-xs font-mono text-slate-600">{catColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Subcategorias (Pressione Adicionar)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Ex: Sensores de Linha, Displays OLED..."
                value={catSubInput}
                onChange={(e) => setCatSubInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubcategory();
                  }
                }}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
              />
              <Button type="button" variant="secondary" size="md" onClick={handleAddSubcategory}>
                Adicionar
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {catSubcategories.map((sub) => (
                <span
                  key={sub}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200"
                >
                  {sub}
                  <button
                    type="button"
                    onClick={() => handleRemoveSubcategory(sub)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setCategoryModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingCategory ? 'Salvar Categoria' : 'Criar Categoria'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Location Create/Edit Modal */}
      <Modal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        title={editingLocation ? 'Editar Localização' : 'Nova Sala / Local do Laboratório'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveLocation} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nome da Sala / Ambiente *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Laboratório de Prototipagem STEM"
              value={locSala}
              onChange={(e) => setLocSala(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Armários e Bancadas do Local
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome do novo armário/bancada..."
                value={newArmarioName}
                onChange={(e) => setNewArmarioName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddArmario();
                  }
                }}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
              />
              <Button type="button" variant="secondary" size="md" onClick={handleAddArmario}>
                + Armário
              </Button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {locArmarios.map((arm, armIdx) => (
                <div key={armIdx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">{arm.nome}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveArmario(armIdx)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                    >
                      Remover Armário
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 items-center">
                    {arm.prateleiras.map((prat, pIdx) => (
                      <span
                        key={pIdx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white text-slate-700 text-xs border border-slate-200"
                      >
                        {prat}
                        <button
                          type="button"
                          onClick={() => handleRemoveShelfFromArmario(armIdx, pIdx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const name = window.prompt('Nome da nova prateleira / nível:');
                        if (name) handleAddShelfToArmario(armIdx, name);
                      }}
                      className="text-[11px] text-purple-700 font-semibold hover:underline px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200"
                    >
                      + Prateleira
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setLocationModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingLocation ? 'Salvar Localização' : 'Criar Localização'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Category Target Confirmation */}
      {deleteCatTarget && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteCatTarget(null)}
          title="Excluir Categoria"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Deseja remover a categoria <strong>{deleteCatTarget.nome}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setDeleteCatTarget(null)}>
                Cancelar
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDeleteCategory(deleteCatTarget)}>
                Sim, Excluir
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Location Target Confirmation */}
      {deleteLocTarget && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteLocTarget(null)}
          title="Excluir Localização"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Deseja remover a sala <strong>{deleteLocTarget.sala}</strong> e seus armários vinculados?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setDeleteLocTarget(null)}>
                Cancelar
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDeleteLocation(deleteLocTarget)}>
                Sim, Excluir
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
