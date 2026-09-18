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
import { Item, Category } from '../../types/inventory';
import { Card } from '../common/Card';

interface CategoryBarChartProps {
  items: Item[];
  categories: Category[];
}

const COLORS = [
  '#7c3aed', // violet / purple
  '#9333ea', // purple
  '#f59e0b', // amber / yellow
  '#a855f7', // purple light
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#ec4899', // pink
  '#64748b', // slate
];

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({ items, categories }) => {
  const data = categories.map((cat, index) => {
    const catItems = items.filter((i) => i.categoria === cat.nome);
    const totalQty = catItems.reduce((acc, curr) => acc + curr.quantidadeAtual, 0);
    const totalItems = catItems.length;
    const totalValue = catItems.reduce((acc, curr) => acc + (curr.precoUnitario || 0) * curr.quantidadeAtual, 0);

    return {
      nome: cat.nome,
      shortName: cat.nome.split('/')[0].split(' ')[0],
      totalQty,
      totalItems,
      totalValue,
      color: COLORS[index % COLORS.length],
    };
  });

  return (
    <Card
      title="Estoque por Categoria"
      subtitle="Quantidade total de materiais físicos cadastrados por categoria"
      className="h-full"
    >
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="shortName"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              interval={0}
              angle={-20}
              textAnchor="end"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1 border border-purple-800">
                      <p className="font-bold text-sm text-purple-300">{d.nome}</p>
                      <p className="text-slate-300">
                        Total de Itens Físicos: <span className="font-bold text-amber-300">{d.totalQty} un/rolos</span>
                      </p>
                      <p className="text-slate-300">
                        Cadastros Únicos: <span className="font-semibold text-white">{d.totalItems} produtos</span>
                      </p>
                      <p className="text-slate-300">
                        Valor Total Estimado:{' '}
                        <span className="font-semibold text-emerald-400">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.totalValue)}
                        </span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="totalQty" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
