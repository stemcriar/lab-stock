import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { StatCard } from '../components/dashboard/StatCard';
import { LowStockAlertList } from '../components/dashboard/LowStockAlertList';
import { CategoryBarChart } from '../components/dashboard/CategoryBarChart';
import { MovementLineChart } from '../components/dashboard/MovementLineChart';
import { TopMovedItemsChart } from '../components/dashboard/TopMovedItemsChart';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Item } from '../types/inventory';
import { formatCurrency } from '../utils/formatters';
import { exportLowStockReportCSV } from '../utils/exportUtils';
import {
  Boxes,
  Layers,
  AlertTriangle,
  DollarSign,
  PlusCircle,
  ArrowLeftRight,
  Download,
  CheckCircle2,
  Sparkles,
  Flame,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    items,
    categories,
    movements,
    lowStockItems,
    totalItemsCount,
    totalCategoriesCount,
    totalInventoryValue,
    registerMovement,
  } = useInventory();

  // Quick Restock Modal State
  const [quickRestockItem, setQuickRestockItem] = useState<Item | null>(null);
  const [restockQty, setRestockQty] = useState<number>(5);
  const [restockReason, setRestockReason] = useState<string>('Reposição de estoque crítico / compra');
  const [restockUser, setRestockUser] = useState<string>('Almoxarifado');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenRestock = (item: Item) => {
    const suggested = Math.max(1, (item.quantidadeIdeal || item.quantidadeMinima * 2) - item.quantidadeAtual);
    setQuickRestockItem(item);
    setRestockQty(suggested);
  };

  const handleConfirmRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRestockItem || restockQty <= 0) return;

    setIsSubmitting(true);
    try {
      const result = await registerMovement({
        itemId: quickRestockItem.id,
        tipo: 'entrada',
        quantidade: Number(restockQty),
        motivo: restockReason,
        responsavel: restockUser,
      });

      setIsSubmitting(false);

      if (result.success) {
        showToast('Estoque Reposto!', result.message, 'success');
        setQuickRestockItem(null);
      } else {
        showToast('Erro na movimentação', result.message, 'error');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      showToast('Erro ao repor', err.message || 'Falha ao salvar no banco SQLite.', 'error');
    }
  };

  const handleExportLowStock = () => {
    if (lowStockItems.length === 0) {
      showToast('Nenhum item pendente', 'Não há itens em nível crítico para exportar no momento.', 'info');
      return;
    }
    exportLowStockReportCSV(items);
    showToast('Relatório Exportado!', 'Arquivo CSV de reposição baixado com sucesso.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Dashboard Geral <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">STEM CRIAR</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Visão consolidada dos materiais, insumos e movimentações do laboratório
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-4 h-4 text-slate-600" />}
              onClick={handleExportLowStock}
            >
              Exportar Compras CSV
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={<ArrowLeftRight className="w-4 h-4 text-purple-600" />}
            onClick={() => navigate('/movimentacoes')}
            className="hover:bg-purple-50 hover:text-purple-700"
          >
            Nova Movimentação
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<PlusCircle className="w-4 h-4 text-amber-300" />}
            onClick={() => navigate('/cadastro')}
          >
            Cadastrar Item
          </Button>
        </div>
      </div>

      {/* Clean Database Welcome Banner if 0 items */}
      {items.length === 0 && (
        <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md border border-purple-400/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-amber-300 shrink-0 border border-white/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                Laboratório de Prototipagem - STEM CRIAR
              </h3>
              <p className="text-sm text-purple-100 mt-1 max-w-xl leading-relaxed">
                A base de dados está limpa e pronta para receber seus materiais, componentes e ferramentas. As 8 categorias padrão e estrutura física de salas/armários já estão preparadas.
              </p>
            </div>
          </div>
          <Button
            variant="amber"
            size="md"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => navigate('/cadastro')}
            className="shrink-0"
          >
            Cadastrar 1º Item
          </Button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Itens"
          value={totalItemsCount}
          subtitle="Tipos de materiais cadastrados"
          icon={<Boxes className="w-6 h-6" />}
          iconBgColor="bg-purple-50 text-purple-600 border border-purple-100"
          onClick={() => navigate('/estoque')}
        />

        <StatCard
          title="Categorias Ativas"
          value={totalCategoriesCount}
          subtitle="Grupos de insumos & bancadas"
          icon={<Layers className="w-6 h-6" />}
          iconBgColor="bg-amber-50 text-amber-600 border border-amber-200"
          onClick={() => navigate('/categorias-localizacoes')}
        />

        <StatCard
          title="Estoque Baixo / Crítico"
          value={lowStockItems.length}
          subtitle={
            lowStockItems.length > 0
              ? `${lowStockItems.length} itens abaixo do mínimo`
              : 'Nenhum alerta pendente'
          }
          icon={<AlertTriangle className="w-6 h-6" />}
          iconBgColor={
            lowStockItems.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-50 text-emerald-600'
          }
          alert={lowStockItems.length > 0}
          onClick={() => navigate('/estoque?status=baixo')}
        />

        <StatCard
          title="Valor Total do Estoque"
          value={formatCurrency(totalInventoryValue)}
          subtitle="Patrimônio estimado em materiais"
          icon={<DollarSign className="w-6 h-6" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Critical Stock Alert Section (Only if items exist) */}
      {items.length > 0 && <LowStockAlertList items={lowStockItems} onQuickMove={handleOpenRestock} />}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBarChart items={items} categories={categories} />
        <MovementLineChart movements={movements} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopMovedItemsChart movements={movements} items={items} />
        </div>

        {/* Quick Tips & System Status */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between border border-slate-800">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" /> Diretrizes de Inventário • STEM CRIAR
            </div>
            <h4 className="text-base font-bold text-white leading-snug">
              Boas práticas para a bancada do laboratório
            </h4>
            <ul className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1.5" />
                <span>Registre cada retirada imediatamente para manter a rastreabilidade dos projetos.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1.5" />
                <span>Substâncias químicas e inflamáveis devem ser armazenadas no armário corta-fogo.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                <span>Filamentos 3D devem retornar para a estufa com sílica após a impressão.</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>Sistema LabStock Pronto</span>
            <button
              onClick={() => navigate('/cadastro')}
              className="text-amber-400 hover:text-amber-300 font-bold"
            >
              Novo Cadastro →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Restock Modal */}
      {quickRestockItem && (
        <Modal
          isOpen={true}
          onClose={() => setQuickRestockItem(null)}
          title={`Repor Estoque: ${quickRestockItem.nome}`}
          subtitle={`Código: ${quickRestockItem.id} | Saldo Atual: ${quickRestockItem.quantidadeAtual} ${quickRestockItem.unidadeMedida}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmRestock} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Quantidade de Entrada ({quickRestockItem.unidadeMedida}) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={restockQty}
                onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-bold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Novo saldo previsto:{' '}
                <span className="font-bold text-emerald-600">
                  {quickRestockItem.quantidadeAtual + (Number(restockQty) || 0)} {quickRestockItem.unidadeMedida}
                </span>{' '}
                (Mínimo ideal: {quickRestockItem.quantidadeIdeal} {quickRestockItem.unidadeMedida})
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Motivo da Entrada *
              </label>
              <input
                type="text"
                required
                value={restockReason}
                onChange={(e) => setRestockReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Responsável pelo Recebimento
              </label>
              <input
                type="text"
                value={restockUser}
                onChange={(e) => setRestockUser(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setQuickRestockItem(null)}>
                Cancelar
              </Button>
              <Button variant="success" size="sm" type="submit" isLoading={isSubmitting}>
                Confirmar Reposição
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
