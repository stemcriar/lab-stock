import { Item, StockStatus } from '../types/inventory';

export function getStockStatus(item: Item): StockStatus {
  if (item.quantidadeAtual <= 0) {
    return 'zerado';
  }
  if (item.quantidadeAtual <= item.quantidadeMinima * 0.5) {
    return 'critico';
  }
  if (item.quantidadeAtual <= item.quantidadeMinima) {
    return 'baixo';
  }
  return 'ok';
}

export function isLowStock(item: Item): boolean {
  return item.quantidadeAtual <= item.quantidadeMinima;
}

export function getStockPercentage(item: Item): number {
  const target = item.quantidadeIdeal > 0 ? item.quantidadeIdeal : (item.quantidadeMinima * 2 || 1);
  const pct = (item.quantidadeAtual / target) * 100;
  return Math.min(Math.round(pct), 100);
}

export function getStockStatusConfig(status: StockStatus) {
  switch (status) {
    case 'zerado':
      return {
        label: 'Sem Estoque',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        dotClass: 'bg-rose-500',
        colorClass: 'text-rose-600',
        progressClass: 'bg-rose-500',
      };
    case 'critico':
      return {
        label: 'Estoque Crítico',
        badgeClass: 'bg-red-100 text-red-800 border-red-200',
        dotClass: 'bg-red-500 animate-pulse',
        colorClass: 'text-red-600',
        progressClass: 'bg-red-500',
      };
    case 'baixo':
      return {
        label: 'Estoque Baixo',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        dotClass: 'bg-amber-500',
        colorClass: 'text-amber-600',
        progressClass: 'bg-amber-500',
      };
    case 'ok':
    default:
      return {
        label: 'Estoque Normal',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dotClass: 'bg-emerald-500',
        colorClass: 'text-emerald-600',
        progressClass: 'bg-emerald-500',
      };
  }
}

export function calculateStockDeficit(item: Item): number {
  const ideal = item.quantidadeIdeal || (item.quantidadeMinima * 2);
  const diff = ideal - item.quantidadeAtual;
  return diff > 0 ? diff : 0;
}
