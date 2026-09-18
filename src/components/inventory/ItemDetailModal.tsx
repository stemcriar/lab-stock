import React, { useState } from 'react';
import { Item, Movement } from '../../types/inventory';
import { Modal } from '../common/Modal';
import { StockStatusBadge, Badge } from '../common/Badge';
import { StockHealthGauge } from './StockHealthGauge';
import { Button } from '../common/Button';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { getStockStatus } from '../../utils/stockUtils';
import {
  MapPin,
  Tag,
  Building2,
  Calendar,
  Layers,
  ArrowLeftRight,
  Edit,
  History,
  Info,
  QrCode,
  Printer,
  Package,
  Sparkles,
} from 'lucide-react';

interface ItemDetailModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: Item) => void;
  onMove: (item: Item) => void;
  movements: Movement[];
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onEdit,
  onMove,
  movements,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'tag'>('info');

  if (!item) return null;

  const status = getStockStatus(item);
  const totalValue = (item.precoUnitario || 0) * item.quantidadeAtual;
  const itemMovements = movements.filter((m) => m.itemId === item.id);

  const handlePrintTag = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.nome}
      subtitle={`Código único: ${item.id} | STEM CRIAR`}
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500">
            Atualizado em {formatDateTime(item.dataUltimaAtualizacao)}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Edit className="w-4 h-4" />}
              onClick={() => {
                onClose();
                onEdit(item);
              }}
            >
              Editar Item
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<ArrowLeftRight className="w-4 h-4" />}
              onClick={() => {
                onClose();
                onMove(item);
              }}
            >
              Movimentar Estoque
            </Button>
          </div>
        </div>
      }
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('info')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'info'
              ? 'border-purple-600 text-purple-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Info className="w-4 h-4" />
          Ficha Técnica & Estoque
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'history'
              ? 'border-purple-600 text-purple-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Histórico de Movimentações ({itemMovements.length})
        </button>
        <button
          onClick={() => setActiveTab('tag')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'tag'
              ? 'border-purple-600 text-purple-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4" />
          Etiqueta de Bancada
        </button>
      </div>

      {/* Tab 1: Info */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          {/* Main Top Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Image Preview */}
            <div className="md:col-span-1 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-square flex items-center justify-center relative">
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
                <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <Package className="w-12 h-12 stroke-[1.5] text-purple-300" />
                  <span className="text-xs mt-2">Sem imagem cadastrada</span>
                </div>
              )}
              <div className="absolute top-2 right-2">
                <StockStatusBadge status={status} size="sm" />
              </div>
            </div>

            {/* Quick Metrics & Location */}
            <div className="md:col-span-2 space-y-4">
              {/* Category & Tags */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    {item.categoria}
                  </span>
                  {item.subcategoria && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {item.subcategoria}
                    </span>
                  )}
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {item.tags.map((tag, idx) => (
                      <Badge key={idx} variant="purple" size="sm">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Stock Gauge Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Situação do Estoque</span>
                  <StockStatusBadge status={status} size="sm" />
                </div>
                <StockHealthGauge item={item} showDetails={true} />
              </div>

              {/* Location Card */}
              <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-start gap-3 text-sm">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700 shrink-0 mt-0.5 border border-purple-200">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-wide text-purple-900 flex items-center gap-1.5">
                    Localização no Laboratório <Sparkles className="w-3 h-3 text-amber-500" />
                  </h5>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {item.localizacao.sala} › {item.localizacao.armario} › {item.localizacao.prateleira}
                  </p>
                  {item.localizacao.posicao && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      Posição / Gaveta: <span className="font-bold text-slate-900">{item.localizacao.posicao}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs text-slate-500 block">Qtd Atual</span>
              <span className="text-base font-bold text-slate-900">
                {item.quantidadeAtual} {item.unidadeMedida}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Preço Unitário</span>
              <span className="text-base font-bold text-slate-900">{formatCurrency(item.precoUnitario)}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Valor Total Patrimônio</span>
              <span className="text-base font-extrabold text-purple-700">{formatCurrency(totalValue)}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Fornecedor</span>
              <span className="text-sm font-semibold text-slate-800 truncate block">
                {item.fornecedor || 'Não informado'}
              </span>
            </div>
          </div>

          {/* Observations */}
          {item.observacoes && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-sm">
              <h5 className="font-bold text-amber-900 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-600" /> Observações e Instruções Técnicas
              </h5>
              <p className="text-slate-700 whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                {item.observacoes}
              </p>
            </div>
          )}

          {/* Metadata dates */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span>Cadastrado em: {formatDate(item.dataCadastro)}</span>
            <span>Última movimentação / atualização: {formatDateTime(item.dataUltimaAtualizacao)}</span>
          </div>
        </div>
      )}

      {/* Tab 2: History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {itemMovements.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              Nenhuma movimentação registrada para este item ainda.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Data / Hora</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Qtd</th>
                    <th className="py-2.5 px-3">Saldo</th>
                    <th className="py-2.5 px-3">Motivo</th>
                    <th className="py-2.5 px-3">Responsável</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itemMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-medium text-slate-700 whitespace-nowrap">
                        {formatDateTime(mov.data)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            mov.tipo === 'entrada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : mov.tipo === 'saida'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {mov.tipo}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {mov.tipo === 'entrada' ? '+' : mov.tipo === 'saida' ? '-' : '='}
                        {mov.quantidade} {item.unidadeMedida}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {mov.quantidadeAnterior !== undefined && mov.quantidadeApos !== undefined
                          ? `${mov.quantidadeAnterior} → ${mov.quantidadeApos}`
                          : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-[200px] truncate" title={mov.motivo}>
                        {mov.motivo}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{mov.responsavel || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Tag / Barcode simulator */}
      {activeTab === 'tag' && (
        <div className="space-y-6">
          <p className="text-xs text-slate-500">
            Prévia da etiqueta de identificação física para gaveteiros e bancadas do Laboratório de Prototipagem STEM CRIAR.
          </p>

          <div className="flex justify-center p-6 bg-slate-100 rounded-2xl">
            {/* Tag Simulation */}
            <div className="bg-white border-2 border-purple-950 p-5 rounded-xl shadow-md max-w-sm w-full space-y-3 font-sans">
              <div className="flex items-center justify-between border-b-2 border-purple-950 pb-2">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-purple-700">STEM CRIAR • LAB</span>
                  <h4 className="font-mono font-bold text-sm text-slate-900">{item.id}</h4>
                </div>
                <div className="w-10 h-10 border border-purple-950 flex items-center justify-center p-1 bg-purple-50">
                  <QrCode className="w-8 h-8 text-purple-900" />
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm leading-snug">{item.nome}</h3>
                <p className="text-xs text-purple-800 mt-0.5 font-semibold">{item.categoria} {item.subcategoria ? `• ${item.subcategoria}` : ''}</p>
              </div>

              <div className="bg-purple-50/80 p-2.5 rounded-lg text-[11px] font-mono text-purple-950 border border-purple-200">
                <div>LOC: {item.localizacao.sala}</div>
                <div>ARM: {item.localizacao.armario} | PRAT: {item.localizacao.prateleira}</div>
                {item.localizacao.posicao && <div>POS: {item.localizacao.posicao}</div>}
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                <span>MÍN: {item.quantidadeMinima} {item.unidadeMedida}</span>
                <span>IDEAL: {item.quantidadeIdeal} {item.unidadeMedida}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              icon={<Printer className="w-4 h-4" />}
              onClick={handlePrintTag}
            >
              Imprimir Etiqueta
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
