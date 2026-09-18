import React from 'react';
import { Item } from '../../types/inventory';
import { getStockStatus, getStockStatusConfig, getStockPercentage } from '../../utils/stockUtils';

interface StockHealthGaugeProps {
  item: Item;
  showDetails?: boolean;
}

export const StockHealthGauge: React.FC<StockHealthGaugeProps> = ({ item, showDetails = true }) => {
  const status = getStockStatus(item);
  const config = getStockStatusConfig(status);
  const percentage = getStockPercentage(item);

  return (
    <div className="w-full space-y-1.5">
      {showDetails && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Nível de Estoque</span>
          <span className={`font-semibold ${config.colorClass}`}>
            {item.quantidadeAtual} / {item.quantidadeIdeal || item.quantidadeMinima * 2} {item.unidadeMedida} ({percentage}%)
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 flex">
        <div
          className={`h-full transition-all duration-500 rounded-full ${config.progressClass}`}
          style={{ width: `${Math.max(5, percentage)}%` }}
        />
      </div>
      {showDetails && (
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>Mín: {item.quantidadeMinima} {item.unidadeMedida}</span>
          <span>Ideal: {item.quantidadeIdeal} {item.unidadeMedida}</span>
        </div>
      )}
    </div>
  );
};
