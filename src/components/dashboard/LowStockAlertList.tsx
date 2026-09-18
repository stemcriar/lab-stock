import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Item } from '../../types/inventory';
import { StockStatusBadge } from '../common/Badge';
import { getStockStatus } from '../../utils/stockUtils';
import { AlertTriangle, ArrowRight, ArrowLeftRight, PackagePlus } from 'lucide-react';
import { Button } from '../common/Button';

interface LowStockAlertListProps {
  items: Item[];
  onQuickMove: (item: Item) => void;
}

export const LowStockAlertList: React.FC<LowStockAlertListProps> = ({ items, onQuickMove }) => {
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <PackagePlus className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-emerald-900">Estoque 100% Regularizado</h4>
        <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
          Nenhum item do laboratório está com quantidade abaixo do limite mínimo configurado no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-rose-200/90 shadow-sm overflow-hidden">
      {/* Alert Header */}
      <div className="bg-gradient-to-r from-rose-500 to-red-600 px-5 py-4 text-white flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">
              Atenção: Itens em Nível Crítico / Baixo ({items.length})
            </h3>
            <p className="text-xs text-rose-100 mt-0.5">
              Itens que atingiram ou caíram abaixo da quantidade mínima e exigem compra ou reposição.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/estoque?status=baixo')}
          className="bg-white text-rose-700 hover:bg-rose-50 border-none font-semibold text-xs shadow-sm"
        >
          Ver Todos <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      {/* List / Table of items */}
      <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
        {items.map((item) => {
          const status = getStockStatus(item);
          const deficit = Math.max(0, (item.quantidadeIdeal || item.quantidadeMinima * 2) - item.quantidadeAtual);

          return (
            <div
              key={item.id}
              className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {item.fotoUrl ? (
                    <img src={item.fotoUrl} alt={item.nome} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 font-mono">{item.id}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-slate-500">{item.id}</span>
                    <StockStatusBadge status={status} size="sm" />
                    <span className="text-xs text-slate-400 hidden md:inline">• {item.categoria}</span>
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm truncate max-w-md mt-0.5" title={item.nome}>
                    {item.nome}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Loc: {item.localizacao.sala} › {item.localizacao.armario} ({item.localizacao.prateleira})
                  </p>
                </div>
              </div>

              {/* Quantities & Quick Action */}
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-12 sm:pl-0">
                <div className="text-right">
                  <div className="text-xs">
                    <span className="text-slate-400">Atual: </span>
                    <span className="font-bold text-rose-600 text-sm">
                      {item.quantidadeAtual} {item.unidadeMedida}
                    </span>
                    <span className="text-slate-400 ml-2">Mín: {item.quantidadeMinima} {item.unidadeMedida}</span>
                  </div>
                  <div className="text-[11px] text-amber-700 font-medium">
                    Sugerido repor: +{deficit} {item.unidadeMedida}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  icon={<ArrowLeftRight className="w-3.5 h-3.5" />}
                  onClick={() => onQuickMove(item)}
                  className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 shadow-rose-600/20 text-xs py-1.5"
                >
                  Repor Estoque
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
