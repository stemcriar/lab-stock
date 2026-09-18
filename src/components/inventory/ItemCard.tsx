import React from 'react';
import { Item } from '../../types/inventory';
import { StockStatusBadge } from '../common/Badge';
import { StockHealthGauge } from './StockHealthGauge';
import { formatCurrency } from '../../utils/formatters';
import { getStockStatus } from '../../utils/stockUtils';
import { MapPin, ArrowLeftRight, Eye, Edit, Tag, Package } from 'lucide-react';

interface ItemCardProps {
  item: Item;
  onViewDetails: (item: Item) => void;
  onQuickMove: (item: Item) => void;
  onEdit: (item: Item) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onViewDetails,
  onQuickMove,
  onEdit,
}) => {
  const status = getStockStatus(item);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Card Header & Photo */}
        <div className="relative h-40 bg-slate-100 overflow-hidden border-b border-slate-100 flex items-center justify-center">
          {item.fotoUrl ? (
            <img
              src={item.fotoUrl}
              alt={item.nome}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <Package className="w-10 h-10 stroke-[1.5] text-purple-300" />
              <span className="text-[11px] mt-1">Sem imagem</span>
            </div>
          )}

          {/* Status Badge Over Image */}
          <div className="absolute top-2.5 right-2.5">
            <StockStatusBadge status={status} size="sm" />
          </div>

          {/* ID Tag Over Image */}
          <div className="absolute top-2.5 left-2.5">
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-900/80 text-amber-300 border border-purple-500/40 backdrop-blur-sm shadow-sm">
              {item.id}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-3">
          {/* Category & Subcategory */}
          <div className="flex items-center gap-1.5 text-xs text-purple-600 font-semibold truncate">
            <span>{item.categoria}</span>
            {item.subcategoria && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-normal truncate">{item.subcategoria}</span>
              </>
            )}
          </div>

          {/* Item Name */}
          <h4
            onClick={() => onViewDetails(item)}
            className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-purple-600 cursor-pointer min-h-[2.5rem]"
            title={item.nome}
          >
            {item.nome}
          </h4>

          {/* Location Badge */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
            <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span className="truncate font-medium">
              {item.localizacao.sala} › {item.localizacao.armario}
            </span>
          </div>

          {/* Gauge */}
          <div className="pt-1">
            <StockHealthGauge item={item} showDetails={true} />
          </div>

          {/* Price & Tags snippet */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="text-slate-500">
              Valor Un.: <span className="font-bold text-slate-800">{formatCurrency(item.precoUnitario)}</span>
            </div>
            {item.tags && item.tags.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-purple-600 font-medium">
                <Tag className="w-3 h-3 text-amber-500" />
                <span>{item.tags.length} tags</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onViewDetails(item)}
          className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-purple-50 hover:text-purple-700 text-slate-700 text-xs font-semibold border border-slate-200 hover:border-purple-200 transition-colors shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Detalhes</span>
        </button>

        <button
          onClick={() => onQuickMove(item)}
          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 transition-colors shadow-2xs"
          title="Movimentar estoque"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-purple-600" />
          <span>Movimentar</span>
        </button>

        <button
          onClick={() => onEdit(item)}
          className="p-1.5 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-100/60 transition-colors"
          title="Editar cadastro"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
