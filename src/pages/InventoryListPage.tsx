import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { ItemCard } from '../components/inventory/ItemCard';
import { ItemDetailModal } from '../components/inventory/ItemDetailModal';
import { StockStatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { Item } from '../types/inventory';
import { formatCurrency } from '../utils/formatters';
import { getStockStatus } from '../utils/stockUtils';
import { exportInventoryToCSV } from '../utils/exportUtils';
import {
  Search,
  LayoutGrid,
  List,
  PlusCircle,
  Download,
  Eye,
  ArrowLeftRight,
  Edit,
  Trash2,
  X,
  Package,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const InventoryListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const {
    items,
    categories,
    locations,
    movements,
    deleteItem,
    registerMovement,
  } = useInventory();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('todas');
  const [selectedLocation, setSelectedLocation] = useState<string>('todas');
  
  // Initialize status from URL search query (e.g. ?status=baixo)
  const initialStatus = searchParams.get('status') || 'todos';
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals state
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<Item | null>(null);
  const [quickMoveItem, setQuickMoveItem] = useState<Item | null>(null);
  const [moveType, setMoveType] = useState<'entrada' | 'saida' | 'ajuste'>('saida');
  const [moveQty, setMoveQty] = useState<number>(1);
  const [moveReason, setMoveReason] = useState<string>('Uso em bancada / projeto');
  const [moveUser, setMoveUser] = useState<string>('');

  // Available subcategories for the selected category
  const availableSubcategories = useMemo(() => {
    if (selectedCategory === 'todas') return [];
    const cat = categories.find((c) => c.nome === selectedCategory);
    return cat ? cat.subcategorias : [];
  }, [selectedCategory, categories]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search term (name, id, tag, supplier)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = item.nome.toLowerCase().includes(term);
        const matchesId = item.id.toLowerCase().includes(term);
        const matchesSupplier = (item.fornecedor || '').toLowerCase().includes(term);
        const matchesTags = (item.tags || []).some((t) => t.toLowerCase().includes(term));
        if (!matchesName && !matchesId && !matchesSupplier && !matchesTags) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'todas' && item.categoria !== selectedCategory) {
        return false;
      }

      // Subcategory filter
      if (selectedSubcategory !== 'todas' && item.subcategoria !== selectedSubcategory) {
        return false;
      }

      // Location filter
      if (selectedLocation !== 'todas') {
        const locString = `${item.localizacao.sala} - ${item.localizacao.armario}`;
        if (locString !== selectedLocation && item.localizacao.sala !== selectedLocation) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== 'todos') {
        const status = getStockStatus(item);
        if (selectedStatus === 'baixo') {
          if (status !== 'baixo' && status !== 'critico' && status !== 'zerado') return false;
        } else if (selectedStatus !== status) {
          return false;
        }
      }

      return true;
    });
  }, [items, searchTerm, selectedCategory, selectedSubcategory, selectedLocation, selectedStatus]);

  // Summary of filtered items
  const filteredTotalValue = useMemo(() => {
    return filteredItems.reduce((acc, i) => acc + (i.precoUnitario || 0) * i.quantidadeAtual, 0);
  }, [filteredItems]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('todas');
    setSelectedSubcategory('todas');
    setSelectedLocation('todas');
    setSelectedStatus('todos');
    setSearchParams({});
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedCategory !== 'todas' ||
    selectedSubcategory !== 'todas' ||
    selectedLocation !== 'todas' ||
    selectedStatus !== 'todos';

  const handleDelete = async (item: Item) => {
    try {
      const success = await deleteItem(item.id);
      if (success) {
        showToast('Item excluído', `O item ${item.nome} (${item.id}) foi removido do servidor.`, 'info');
        setDeleteConfirmItem(null);
      }
    } catch (err: any) {
      showToast('Erro ao excluir', err.message || 'Falha na comunicação com o servidor.', 'error');
    }
  };

  const handleQuickMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMoveItem || moveQty <= 0) return;

    try {
      const result = await registerMovement({
        itemId: quickMoveItem.id,
        tipo: moveType,
        quantidade: Number(moveQty),
        motivo: moveReason,
        responsavel: moveUser || 'Usuário Lab',
      });

      if (result.success) {
        showToast('Movimentação realizada!', result.message, 'success');
        setQuickMoveItem(null);
      } else {
        showToast('Erro ao movimentar', result.message, 'error');
      }
    } catch (err: any) {
      showToast('Erro na movimentação', err.message || 'Falha ao conectar com o servidor.', 'error');
    }
  };

  const handleExportCSV = () => {
    exportInventoryToCSV(filteredItems);
    showToast('Exportação concluída', 'O arquivo CSV do estoque filtrado foi baixado com sucesso.', 'success');
  };

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Estoque & Consulta <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">STEM CRIAR</span>
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Gerencie, pesquise e filtre todos os itens e materiais do laboratório
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<PlusCircle className="w-4 h-4 text-amber-300" />}
            onClick={() => navigate('/cadastro')}
          >
            Cadastrar Item
          </Button>
        </div>

        <EmptyState
          icon={<Package className="w-8 h-8 text-purple-600" />}
          title="Nenhum item cadastrado no estoque"
          description="Sua base de inventário está pronta para receber os componentes, ferramentas e insumos do laboratório STEM CRIAR."
          actionText="Cadastrar Primeiro Item"
          onAction={() => navigate('/cadastro')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Estoque & Consulta <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">STEM CRIAR</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerencie, pesquise e filtre todos os itens e materiais do laboratório
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-4 h-4 text-slate-600" />}
            onClick={handleExportCSV}
          >
            Exportar CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<PlusCircle className="w-4 h-4 text-amber-300" />}
            onClick={() => navigate('/cadastro')}
          >
            Novo Item
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, código ITEM-XXX, tag ou fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-slate-50/50 hover:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Select */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory('todas');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
            >
              <option value="todas">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.nome}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Location Select */}
          <div className="md:col-span-2">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
            >
              <option value="todas">Todas as Salas</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.sala}>
                  {loc.sala}
                </option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setSearchParams(e.target.value !== 'todos' ? { status: e.target.value } : {});
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
            >
              <option value="todos">Status: Todos</option>
              <option value="ok">Estoque Normal</option>
              <option value="baixo">Abaixo do Mínimo</option>
              <option value="critico">Estoque Crítico</option>
              <option value="zerado">Sem Estoque (Zerado)</option>
            </select>
          </div>
        </div>

        {/* Second row: Subcategory tags + View toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {availableSubcategories.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500 font-semibold">Subcategorias:</span>
                <button
                  onClick={() => setSelectedSubcategory('todas')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedSubcategory === 'todas'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas
                </button>
                {availableSubcategories.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubcategory(sub)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      selectedSubcategory === sub
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
              >
                <X className="w-3.5 h-3.5" /> Limpar Filtros
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'table' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visualização em Tabela"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Tabela</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grade</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Exibindo <span className="font-bold text-slate-800">{filteredItems.length}</span> de{' '}
          <span className="font-bold text-slate-800">{items.length}</span> itens cadastrados
        </div>
        <div className="flex items-center gap-4">
          <span>
            Valor total dos itens listados:{' '}
            <span className="font-extrabold text-purple-700">{formatCurrency(filteredTotalValue)}</span>
          </span>
        </div>
      </div>

      {/* Main Items Display */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title="Nenhum item encontrado"
          description="Nenhum item corresponde aos critérios de busca e filtros selecionados."
          actionText="Limpar Filtros"
          onAction={handleClearFilters}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onViewDetails={(i) => setDetailItem(i)}
              onQuickMove={(i) => {
                setQuickMoveItem(i);
                setMoveType('saida');
                setMoveQty(1);
              }}
              onEdit={(i) => navigate(`/editar/${i.id}`)}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Item & Código</th>
                  <th className="py-3.5 px-4">Categoria</th>
                  <th className="py-3.5 px-4 text-center">Estoque Atual</th>
                  <th className="py-3.5 px-4">Localização</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Valor Unit.</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const status = getStockStatus(item);

                  return (
                    <tr key={item.id} className="hover:bg-purple-50/30 transition-colors group">
                      {/* Name & ID & Photo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {item.fotoUrl ? (
                              <img
                                src={item.fotoUrl}
                                alt={item.nome}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Package className="w-5 h-5 text-purple-300" />
                            )}
                          </div>
                          <div>
                            <span className="font-mono text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200/60 px-1.5 py-0.5 rounded-md">
                              {item.id}
                            </span>
                            <h4
                              onClick={() => setDetailItem(item)}
                              className="font-bold text-slate-900 text-sm hover:text-purple-600 cursor-pointer mt-0.5 line-clamp-1 max-w-xs"
                              title={item.nome}
                            >
                              {item.nome}
                            </h4>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-semibold text-slate-800">{item.categoria}</div>
                        {item.subcategoria && (
                          <div className="text-xs text-slate-400">{item.subcategoria}</div>
                        )}
                      </td>

                      {/* Quantity & Stock Level */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-bold text-slate-900 text-sm">
                          {item.quantidadeAtual} {item.unidadeMedida}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Mín: {item.quantidadeMinima} | Ideal: {item.quantidadeIdeal}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-slate-700 font-semibold flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span>{item.localizacao.sala}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 pl-4.5">
                          {item.localizacao.armario} › {item.localizacao.prateleira}
                          {item.localizacao.posicao && ` (${item.localizacao.posicao})`}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <StockStatusBadge status={status} size="sm" />
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                        {formatCurrency(item.precoUnitario)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailItem(item)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            title="Ver detalhes completos"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setQuickMoveItem(item);
                              setMoveType('saida');
                              setMoveQty(1);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            title="Movimentar estoque"
                          >
                            <ArrowLeftRight className="w-4 h-4 text-purple-600" />
                          </button>
                          <button
                            onClick={() => navigate(`/editar/${item.id}`)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Editar item"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmItem(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Excluir item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={detailItem}
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={(item) => navigate(`/editar/${item.id}`)}
        onMove={(item) => {
          setQuickMoveItem(item);
          setMoveType('saida');
          setMoveQty(1);
        }}
        movements={movements}
      />

      {/* Quick Movement Modal */}
      {quickMoveItem && (
        <Modal
          isOpen={true}
          onClose={() => setQuickMoveItem(null)}
          title={`Movimentar: ${quickMoveItem.nome}`}
          subtitle={`Código: ${quickMoveItem.id} | Saldo Atual: ${quickMoveItem.quantidadeAtual} ${quickMoveItem.unidadeMedida}`}
          maxWidth="md"
        >
          <form onSubmit={handleQuickMove} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tipo de Movimentação *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMoveType('saida')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    moveType === 'saida'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Saída (-)
                </button>
                <button
                  type="button"
                  onClick={() => setMoveType('entrada')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    moveType === 'entrada'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Entrada (+)
                </button>
                <button
                  type="button"
                  onClick={() => setMoveType('ajuste')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    moveType === 'ajuste'
                      ? 'bg-purple-50 border-purple-500 text-purple-700 ring-2 ring-purple-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Ajuste (=)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {moveType === 'ajuste' ? 'Novo Saldo Contado' : 'Quantidade a Movimentar'} (
                {quickMoveItem.unidadeMedida}) *
              </label>
              <input
                type="number"
                min={moveType === 'ajuste' ? '0' : '1'}
                max={moveType === 'saida' ? quickMoveItem.quantidadeAtual : undefined}
                required
                value={moveQty}
                onChange={(e) => setMoveQty(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-bold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Saldo após operação:{' '}
                <span className="font-bold text-slate-800">
                  {moveType === 'entrada'
                    ? quickMoveItem.quantidadeAtual + (Number(moveQty) || 0)
                    : moveType === 'saida'
                    ? Math.max(0, quickMoveItem.quantidadeAtual - (Number(moveQty) || 0))
                    : Number(moveQty) || 0}{' '}
                  {quickMoveItem.unidadeMedida}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Motivo da Movimentação *
              </label>
              <input
                type="text"
                required
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value)}
                placeholder="Ex: Aula prática de Robótica, Compra de reposição..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Responsável / Solicitante
              </label>
              <input
                type="text"
                value={moveUser}
                onChange={(e) => setMoveUser(e.target.value)}
                placeholder="Ex: Monitor Lucas, Prof. Carlos..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setQuickMoveItem(null)}>
                Cancelar
              </Button>
              <Button
                variant={moveType === 'saida' ? 'danger' : moveType === 'entrada' ? 'success' : 'primary'}
                size="sm"
                type="submit"
              >
                Confirmar Movimentação
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmItem(null)}
          title="Excluir Item do Estoque"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Tem certeza que deseja excluir o item{' '}
              <strong className="text-slate-900">{deleteConfirmItem.nome}</strong> (
              {deleteConfirmItem.id})? Esta ação não poderá ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmItem(null)}>
                Cancelar
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(deleteConfirmItem)}>
                Sim, Excluir
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
