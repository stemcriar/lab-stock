import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Movement, Item } from '../../types/inventory';
import { Card } from '../common/Card';

interface TopMovedItemsChartProps {
  movements: Movement[];
  items: Item[];
}

export const TopMovedItemsChart: React.FC<TopMovedItemsChartProps> = ({ movements, items }) => {
  // Calculate total consumed / moved quantity per item
  const itemMap = new Map<string, { id: string; nome: string; totalMovido: number; totalSaidas: number }>();

  movements.forEach((mov) => {
    const existing = itemMap.get(mov.itemId) || {
      id: mov.itemId,
      nome: mov.itemNome || mov.itemId,
      totalMovido: 0,
      totalSaidas: 0,
    };

    existing.totalMovido += mov.quantidade;
    if (mov.tipo === 'saida') {
      existing.totalSaidas += mov.quantidade;
    }

    itemMap.set(mov.itemId, existing);
  });

  // Sort by highest exit / usage count, top 5
  const topItems = Array.from(itemMap.values())
    .sort((a, b) => b.totalSaidas - a.totalSaidas || b.totalMovido - a.totalMovido)
    .slice(0, 5)
    .map((item) => {
      const fullItem = items.find((i) => i.id === item.id);
      const shortName = item.nome.length > 24 ? item.nome.slice(0, 22) + '...' : item.nome;

      return {
        ...item,
        shortName,
        unidade: fullItem?.unidadeMedida || 'un',
      };
    });

  return (
    <Card
      title="Ranking de Itens Mais Utilizados"
      subtitle="Materiais com maior volume de saídas e requisições no laboratório"
      className="h-full"
    >
      <div className="h-72 w-full pt-2">
        {topItems.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Nenhuma movimentação de saída registrada ainda.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topItems}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="shortName"
                tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                width={130}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1 border border-purple-800">
                        <p className="font-bold text-amber-300">{d.nome}</p>
                        <p className="text-slate-300">Código: <span className="font-mono text-purple-300">{d.id}</span></p>
                        <p className="text-rose-400 font-semibold">
                          Total de Saídas / Uso: {d.totalSaidas} {d.unidade}
                        </p>
                        <p className="text-slate-300">
                          Movimentações Totais: {d.totalMovido} {d.unidade}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="totalSaidas" fill="#7c3aed" radius={[0, 6, 6, 0]}>
                {topItems.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#7c3aed' : index === 1 ? '#f59e0b' : '#9333ea'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
