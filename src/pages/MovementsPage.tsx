import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { StockStatusBadge } from '../components/common/Badge';
import { MovementType } from '../types/inventory';
import { formatDateTime } from '../utils/formatters';
import { getStockStatus } from '../utils/stockUtils';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Package,
  MapPin,
  PlusCircle,
} from 'lucide-react';

const COMMON_REASONS = {
  saida: [
    'Uso em projeto de bancada',
    'Aula prática de laboratório',
    'Montagem de protótipo / TCC',
    'Descarte por quebra / defeito',
    'Empréstimo para aluno/pesquisador',
  ],
  entrada: [
    'Compra de reposição',
    'Doação institucional',
    'Devolução de empréstimo',
    'Lote inicial de semestre',
  ],
  ajuste: [
    'Ajuste após contagem física (balanço)',
    'Correção de lançamento anterior',
  ],
};

export const MovementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { items, movements, registerMovement } = useInventory();

  // Form State
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');
  const [tipo, setTipo] = useState<MovementType>('saida');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [motivo, setMotivo] = useState<string>('Uso em projeto de bancada');
  const [responsavel, setResponsavel] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter items for search autocomplete
  const filteredItems = useMemo(() => {
    if (!itemSearchQuery.trim()) return items.slice(0, 8);
    const q = itemSearchQuery.toLowerCase();
    return items.filter(
      (i) =>
        i.nome.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.categoria.toLowerCase().includes(q)
    );
  }, [items, itemSearchQuery]);

  // Selected item object
  const selectedItem = useMemo(() => {
    return items.find((i) => i.id === selectedItemId);
  }, [items, selectedItemId]);

  // Set default item if none selected
  React.useEffect(() => {
    if (!selectedItemId && items.length > 0) {
      setSelectedItemId(items[0].id);
    }
  }, [items, selectedItemId]);

  // Calculate resulting quantity
  const calculateResultingStock = (): number => {
    if (!selectedItem) return 0;
    const current = selectedItem.quantidadeAtual;
    const qty = Number(quantidade) || 0;

    if (tipo === 'entrada') return current + qty;
    if (tipo === 'saida') return Math.max(0, current - qty);
    if (tipo === 'ajuste') return qty;
    return current;
  };

  const isExitOverLimit =
    tipo === 'saida' && selectedItem && (Number(quantidade) || 0) > selectedItem.quantidadeAtual;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      showToast('Selecione um item', 'Escolha o item a ser movimentado.', 'warning');
      return;
    }

    if (quantidade <= 0 && tipo !== 'ajuste') {
      showToast('Quantidade inválida', 'A quantidade deve ser maior que zero.', 'warning');
      return;
    }

    if (isExitOverLimit) {
      showToast(
        'Estoque insuficiente!',
        `Não é possível retirar ${quantidade} ${selectedItem.unidadeMedida}. O saldo atual é de ${selectedItem.quantidadeAtual} ${selectedItem.unidadeMedida}.`,
        'error'
      );
      return;
    }

    if (!motivo.trim()) {
      showToast('Informe o motivo', 'O motivo da movimentação é obrigatório.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerMovement({
        itemId: selectedItem.id,
        tipo,
        quantidade: Number(quantidade),
        motivo: motivo.trim(),
        responsavel: responsavel.trim() || undefined,
      });

      setIsSubmitting(false);

      if (result.success) {
        showToast('Movimentação concluída!', result.message, 'success');
        setQuantidade(1);
      } else {
        showToast('Erro ao movimentar', result.message, 'error');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      showToast('Erro na transação', err.message || 'Falha ao salvar no banco SQLite.', 'error');
    }
  };

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Movimentação de Estoque</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Registre entradas de compras, saídas para bancada e ajustes de inventário
          </p>
        </div>
        <EmptyState
          icon={<Package className="w-8 h-8 text-blue-600" />}
          title="Nenhum item cadastrado no laboratório"
          description="Para registrar movimentações de entrada ou saída, primeiro cadastre os materiais e componentes no sistema."
          actionText="Cadastrar Primeiro Item"
          onAction={() => navigate('/cadastro')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Movimentação de Estoque</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Registre entradas de compras, saídas para uso em bancada e ajustes de inventário
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card
            title="Registrar Nova Transação"
            subtitle="Atualização direta e rastreável do saldo físico de materiais"
            icon={<ArrowLeftRight className="w-5 h-5 text-blue-600" />}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. Item Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Selecionar Item do Estoque *
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Pesquise o item por nome ou código ITEM-XXX..."
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
                    />
                  </div>

                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    size={Math.min(4, Math.max(2, filteredItems.length))}
                  >
                    {filteredItems.map((i) => (
                      <option key={i.id} value={i.id} className="p-2 border-b border-slate-100">
                        {i.id} — {i.nome} ({i.quantidadeAtual} {i.unidadeMedida} disponíveis)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected Item Preview Box */}
              {selectedItem && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {selectedItem.fotoUrl ? (
                      <img src={selectedItem.fotoUrl} alt={selectedItem.nome} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-7 h-7 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded">
                        {selectedItem.id}
                      </span>
                      <StockStatusBadge status={getStockStatus(selectedItem)} size="sm" />
                    </div>
                    <h4 className="font-semibold text-slate-900 text-sm truncate">{selectedItem.nome}</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {selectedItem.localizacao.sala} › {selectedItem.localizacao.armario} ({selectedItem.localizacao.prateleira})
                      </span>
                      <span>
                        Saldo Atual:{' '}
                        <strong className="text-slate-900">
                          {selectedItem.quantidadeAtual} {selectedItem.unidadeMedida}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Movement Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Tipo de Movimentação *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTipo('saida');
                      setMotivo(COMMON_REASONS.saida[0]);
                    }}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-bold transition-all ${
                      tipo === 'saida'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-rose-500" />
                    <span>Saída (-)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTipo('entrada');
                      setMotivo(COMMON_REASONS.entrada[0]);
                    }}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-bold transition-all ${
                      tipo === 'entrada'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    <span>Entrada (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTipo('ajuste');
                      setMotivo(COMMON_REASONS.ajuste[0]);
                    }}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-bold transition-all ${
                      tipo === 'ajuste'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Sliders className="w-4 h-4 text-blue-500" />
                    <span>Ajuste (=)</span>
                  </button>
                </div>
              </div>

              {/* 3. Quantity & Dynamic Stock Simulation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {tipo === 'ajuste' ? 'Novo Saldo Contado' : 'Quantidade'} (
                    {selectedItem?.unidadeMedida || 'un'}) *
                  </label>
                  <input
                    type="number"
                    min={tipo === 'ajuste' ? '0' : '1'}
                    max={tipo === 'saida' && selectedItem ? selectedItem.quantidadeAtual : undefined}
                    required
                    value={quantidade}
                    onChange={(e) => setQuantidade(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-base font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isExitOverLimit ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-300'
                    }`}
                  />
                  {isExitOverLimit && (
                    <p className="text-xs text-rose-600 mt-1 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Quantidade excede o estoque disponível!
                    </p>
                  )}
                </div>

                {/* Stock Result Simulation Card */}
                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex flex-col justify-center">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Simulação de Saldo
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-600">
                      {selectedItem?.quantidadeAtual || 0} {selectedItem?.unidadeMedida}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span
                      className={`text-lg font-extrabold ${
                        isExitOverLimit
                          ? 'text-rose-600'
                          : tipo === 'entrada'
                          ? 'text-emerald-600'
                          : 'text-slate-900'
                      }`}
                    >
                      {calculateResultingStock()} {selectedItem?.unidadeMedida}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Reason with quick suggestion chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  3. Motivo / Destino da Movimentação *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aula prática de Eletrônica Digital, TCC..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] text-slate-400 mr-1 self-center">Sugestões:</span>
                  {COMMON_REASONS[tipo].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setMotivo(suggestion)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[11px] text-slate-600 border border-slate-200 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Responsible Person */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  4. Responsável / Solicitante (Opcional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ex: Prof. Carlos Eduardo, Monitor Lucas, Dra. Mariana..."
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <Button
                  variant={tipo === 'saida' ? 'danger' : tipo === 'entrada' ? 'success' : 'primary'}
                  size="lg"
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={Boolean(isExitOverLimit)}
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  className="w-full sm:w-auto"
                >
                  Confirmar {tipo === 'saida' ? 'Baixa (Saída)' : tipo === 'entrada' ? 'Entrada' : 'Ajuste'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Recent Activity Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            title="Últimas Movimentações"
            subtitle="Registro cronológico recente das transações no laboratório"
            icon={<Clock className="w-5 h-5 text-purple-600" />}
          >
            {movements.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Nenhuma movimentação registrada até o momento.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto -mx-5 px-5">
                {movements.slice(0, 10).map((mov) => (
                  <div key={mov.id} className="py-3.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase ${
                          mov.tipo === 'entrada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : mov.tipo === 'saida'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {mov.tipo === 'entrada' ? '+' : mov.tipo === 'saida' ? '-' : '='} {mov.tipo}
                      </span>
                      <span className="text-slate-400 font-mono">{formatDateTime(mov.data)}</span>
                    </div>

                    <h5 className="font-semibold text-slate-900 text-sm line-clamp-1" title={mov.itemNome}>
                      {mov.itemNome || mov.itemId}
                    </h5>

                    <p className="text-slate-600 leading-snug">{mov.motivo}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>
                        Qtd:{' '}
                        <strong className="text-slate-800">
                          {mov.quantidade} un
                        </strong>{' '}
                        {mov.quantidadeAnterior !== undefined && mov.quantidadeApos !== undefined && (
                          <span className="text-slate-400">
                            ({mov.quantidadeAnterior} → {mov.quantidadeApos})
                          </span>
                        )}
                      </span>
                      <span>Resp: {mov.responsavel || 'Lab'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
