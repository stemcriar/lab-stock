import { Item, Movement } from '../types/inventory';
import { formatDate, formatDateTime, formatCurrency } from './formatters';
import { getStockStatus, getStockStatusConfig } from './stockUtils';

function downloadCSV(csvContent: string, fileName: string) {
  // UTF-8 BOM for Microsoft Excel compatibility with accents
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportInventoryToCSV(items: Item[]) {
  const headers = [
    'ID',
    'Nome do Item',
    'Categoria',
    'Subcategoria',
    'Qtd Atual',
    'Unidade',
    'Qtd Mínima',
    'Qtd Ideal',
    'Status',
    'Preço Unitário (R$)',
    'Valor Total (R$)',
    'Sala',
    'Armário',
    'Prateleira',
    'Posição/Gaveta',
    'Fornecedor',
    'Tags',
    'Data Cadastro',
    'Última Atualização'
  ];

  const rows = items.map(item => {
    const status = getStockStatusConfig(getStockStatus(item)).label;
    const totalVal = (item.precoUnitario || 0) * item.quantidadeAtual;
    const tagsStr = (item.tags || []).join('; ');

    return [
      `"${item.id}"`,
      `"${item.nome.replace(/"/g, '""')}"`,
      `"${item.categoria}"`,
      `"${item.subcategoria || ''}"`,
      item.quantidadeAtual,
      `"${item.unidadeMedida}"`,
      item.quantidadeMinima,
      item.quantidadeIdeal,
      `"${status}"`,
      (item.precoUnitario || 0).toFixed(2).replace('.', ','),
      totalVal.toFixed(2).replace('.', ','),
      `"${item.localizacao.sala}"`,
      `"${item.localizacao.armario}"`,
      `"${item.localizacao.prateleira}"`,
      `"${item.localizacao.posicao || ''}"`,
      `"${(item.fornecedor || '').replace(/"/g, '""')}"`,
      `"${tagsStr}"`,
      `"${formatDate(item.dataCadastro)}"`,
      `"${formatDate(item.dataUltimaAtualizacao)}"`
    ].join(';');
  });

  const csv = [headers.join(';'), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `inventario_laboratorio_${dateStr}.csv`);
}

export function exportMovementsToCSV(movements: Movement[]) {
  const headers = [
    'ID Movimentação',
    'Data/Hora',
    'ID Item',
    'Nome do Item',
    'Categoria',
    'Tipo',
    'Quantidade',
    'Qtd Anterior',
    'Qtd Após',
    'Motivo',
    'Responsável'
  ];

  const rows = movements.map(mov => {
    const tipoLabel = mov.tipo === 'entrada' ? 'Entrada' : mov.tipo === 'saida' ? 'Saída' : 'Ajuste de Inventário';
    return [
      `"${mov.id}"`,
      `"${formatDateTime(mov.data)}"`,
      `"${mov.itemId}"`,
      `"${(mov.itemNome || '').replace(/"/g, '""')}"`,
      `"${mov.itemCategoria || ''}"`,
      `"${tipoLabel}"`,
      mov.quantidade,
      mov.quantidadeAnterior !== undefined ? mov.quantidadeAnterior : '',
      mov.quantidadeApos !== undefined ? mov.quantidadeApos : '',
      `"${(mov.motivo || '').replace(/"/g, '""')}"`,
      `"${(mov.responsavel || '').replace(/"/g, '""')}"`
    ].join(';');
  });

  const csv = [headers.join(';'), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `historico_movimentacoes_${dateStr}.csv`);
}

export function exportLowStockReportCSV(items: Item[]) {
  const lowStockItems = items.filter(item => item.quantidadeAtual <= item.quantidadeMinima);
  
  const headers = [
    'ID',
    'Nome do Item',
    'Categoria',
    'Qtd Atual',
    'Qtd Mínima',
    'Qtd Ideal',
    'Necessidade de Compra',
    'Unidade',
    'Preço Estimado Unitário (R$)',
    'Custo Estimado de Reposição (R$)',
    'Fornecedor Recomendado',
    'Localização'
  ];

  const rows = lowStockItems.map(item => {
    const deficit = Math.max(0, item.quantidadeIdeal - item.quantidadeAtual);
    const custo = deficit * (item.precoUnitario || 0);
    const loc = `${item.localizacao.sala} > ${item.localizacao.armario} > ${item.localizacao.prateleira}`;

    return [
      `"${item.id}"`,
      `"${item.nome.replace(/"/g, '""')}"`,
      `"${item.categoria}"`,
      item.quantidadeAtual,
      item.quantidadeMinima,
      item.quantidadeIdeal,
      deficit,
      `"${item.unidadeMedida}"`,
      (item.precoUnitario || 0).toFixed(2).replace('.', ','),
      custo.toFixed(2).replace('.', ','),
      `"${(item.fornecedor || '').replace(/"/g, '""')}"`,
      `"${loc}"`
    ].join(';');
  });

  const csv = [headers.join(';'), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `relatorio_reposicao_estoque_baixo_${dateStr}.csv`);
}
