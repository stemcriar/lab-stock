import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { formatDateTime } from '../utils/formatters';
import { exportMovementsToCSV, exportInventoryToCSV } from '../utils/exportUtils';
import {
  FileSpreadsheet,
  Download,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  X,
  Sparkles,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { showToast } = useToast();
  const { movements, items, categories } = useInventory();

  // Filters State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedItem, setSelectedItem] = useState<string>('todos');
  const [searchResp, setSearchResp] = useState('');

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter((mov) => {
      // Date range
      if (startDate) {
        const start = new Date(startDate).getTime();
        const movDate = new Date(mov.data).getTime();
        if (movDate < start) return false;
      }

      if (endDate) {
        const end = new Date(`${endDate}T23:59:59`).getTime();
        const movDate = new Date(mov.data).getTime();
        if (movDate > end) return false;
      }

      // Type
      if (selectedType !== 'todos' && mov.tipo !== selectedType) {
        return false;
      }

      // Category
      if (selectedCategory !== 'todas') {
        const fullItem = items.find((i) => i.id === mov.itemId);
        if (!fullItem || fullItem.categoria !== selectedCategory) {
          return false;
        }
      }

      // Specific Item
      if (selectedItem !== 'todos' && mov.itemId !== selectedItem) {
        return false;
      }

      // Responsible
      if (searchResp.trim()) {
        const respTerm = searchResp.toLowerCase();
        if (!(mov.responsavel || '').toLowerCase().includes(respTerm)) {
          return false;
        }
      }

      return true;
    });
  }, [movements, items, startDate, endDate, selectedType, selectedCategory, selectedItem, searchResp]);

  // Movement Statistics for filtered list
  const totalEntries = useMemo(() => {
    return filteredMovements
      .filter((m) => m.tipo === 'entrada')
      .reduce((acc, m) => acc + m.quantidade, 0);
  }, [filteredMovements]);

  const totalExits = useMemo(() => {
    return filteredMovements
      .filter((m) => m.tipo === 'saida')
      .reduce((acc, m) => acc + m.quantidade, 0);
  }, [filteredMovements]);

  const handleExportCSV = () => {
    exportMovementsToCSV(filteredMovements);
    showToast('Exportação concluída', 'Histórico de movimentações exportado em CSV com sucesso.', 'success');
  };

  const handleExportFullInventory = () => {
    exportInventoryToCSV(items);
    showToast('Inventário Geral Exportado', 'Relatório completo de inventário físico baixado em CSV.', 'success');
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedType('todos');
    setSelectedCategory('todas');
    setSelectedItem('todos');
    setSearchResp('');
  };

  const hasActiveFilters =
    startDate !== '' ||
    endDate !== '' ||
    selectedType !== 'todos' ||
    selectedCategory !== 'todas' ||
    selectedItem !== 'todos' ||
    searchResp !== '';

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Relatórios & Histórico <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">STEM CRIAR</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Auditoria completa, filtros de período e exportação de dados para planilhas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-4 h-4 text-slate-600" />}
            onClick={handleExportFullInventory}
          >
            Exportar Inventário Completo
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4 text-amber-300" />}
            onClick={handleExportCSV}
          >
            Exportar Histórico Filtrado (CSV)
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards for Filtered Results */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Movimentações Filtradas
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {filteredMovements.length} <span className="text-sm font-normal text-slate-500">registros</span>
          </div>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-emerald-600" /> Total de Entradas
          </span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            +{totalEntries} <span className="text-sm font-normal text-emerald-600">unidades recebidas</span>
          </div>
        </div>

        <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block flex items-center gap-1.5">
            <ArrowDownLeft className="w-4 h-4 text-rose-600" /> Total de Saídas / Consumo
          </span>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">
            -{totalExits} <span className="text-sm font-normal text-rose-600">unidades utilizadas</span>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <Card
        title="Filtros de Auditoria"
        subtitle="Refine o histórico por período de datas, responsável, categoria ou material"
        icon={<Filter className="w-5 h-5 text-purple-600" />}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Start Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Tipo
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="todos">Todos os Tipos</option>
                <option value="entrada">Entradas (+)</option>
                <option value="saida">Saídas (-)</option>
                <option value="ajuste">Ajustes (=)</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="todas">Todas as Categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.nome}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Specific Item */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Item Específico
              </label>
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="todos">Todos os Itens</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.id} - {i.nome.slice(0, 20)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Responsible search */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Responsável
              </label>
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={searchResp}
                onChange={(e) => setSearchResp(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                onClick={handleClearFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
              >
                <X className="w-3.5 h-3.5" /> Limpar Todos os Filtros
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Movements Table */}
      {filteredMovements.length === 0 ? (
        <EmptyState
          title="Nenhum registro encontrado"
          description="Nenhuma movimentação de estoque corresponde aos filtros aplicados."
          actionText="Limpar Filtros"
          onAction={handleClearFilters}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Código / Data</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4">Item & Categoria</th>
                  <th className="py-3.5 px-4 text-center">Quantidade</th>
                  <th className="py-3.5 px-4">Saldo Antes / Depois</th>
                  <th className="py-3.5 px-4">Motivo / Finalidade</th>
                  <th className="py-3.5 px-4">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-purple-50/30 transition-colors">
                    {/* ID & Date */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] text-purple-700 font-bold block">{mov.id}</span>
                      <span className="font-semibold text-slate-700 whitespace-nowrap">
                        {formatDateTime(mov.data)}
                      </span>
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase ${
                          mov.tipo === 'entrada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : mov.tipo === 'saida'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {mov.tipo === 'entrada' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : mov.tipo === 'saida' ? (
                          <ArrowDownLeft className="w-3 h-3" />
                        ) : (
                          <Sliders className="w-3 h-3" />
                        )}
                        {mov.tipo}
                      </span>
                    </td>

                    {/* Item */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 line-clamp-1 max-w-xs" title={mov.itemNome}>
                        {mov.itemNome || mov.itemId}
                      </div>
                      <span className="font-mono text-[10px] text-purple-600 font-semibold">{mov.itemId}</span>
                      {mov.itemCategoria && (
                        <span className="text-slate-400 text-[10px] ml-1.5">• {mov.itemCategoria}</span>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-4 text-center font-extrabold text-sm whitespace-nowrap">
                      <span
                        className={
                          mov.tipo === 'entrada'
                            ? 'text-emerald-600'
                            : mov.tipo === 'saida'
                            ? 'text-rose-600'
                            : 'text-purple-600'
                        }
                      >
                        {mov.tipo === 'entrada' ? '+' : mov.tipo === 'saida' ? '-' : '='}
                        {mov.quantidade} un
                      </span>
                    </td>

                    {/* Stock balance */}
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs whitespace-nowrap">
                      {mov.quantidadeAnterior !== undefined && mov.quantidadeApos !== undefined ? (
                        <span>
                          {mov.quantidadeAnterior} → <strong className="text-slate-900">{mov.quantidadeApos}</strong>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4 text-slate-700 max-w-sm" title={mov.motivo}>
                      <span className="line-clamp-2">{mov.motivo}</span>
                    </td>

                    {/* Responsible */}
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-medium">
                      {mov.responsavel || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
