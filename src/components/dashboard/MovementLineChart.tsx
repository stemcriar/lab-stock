import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Movement } from '../../types/inventory';
import { Card } from '../common/Card';
import { formatDate } from '../../utils/formatters';

interface MovementLineChartProps {
  movements: Movement[];
}

export const MovementLineChart: React.FC<MovementLineChartProps> = ({ movements }) => {
  // Aggregate movements by date (day)
  const dateMap = new Map<string, { data: string; label: string; entradas: number; saidas: number }>();

  // Sort movements chronologically
  const sortedMovements = [...movements].sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
  );

  sortedMovements.forEach((mov) => {
    const dayKey = mov.data.split('T')[0];
    const existing = dateMap.get(dayKey) || {
      data: dayKey,
      label: formatDate(mov.data).slice(0, 5), // DD/MM
      entradas: 0,
      saidas: 0,
    };

    if (mov.tipo === 'entrada') {
      existing.entradas += mov.quantidade;
    } else if (mov.tipo === 'saida') {
      existing.saidas += mov.quantidade;
    }

    dateMap.set(dayKey, existing);
  });

  const chartData = Array.from(dateMap.values());

  return (
    <Card
      title="Fluxo de Movimentações"
      subtitle="Histórico de entradas vs saídas de materiais ao longo do tempo"
      className="h-full"
    >
      <div className="h-72 w-full pt-2">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Nenhuma movimentação registrada no período.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                        <p className="font-bold text-slate-300">Data: {label}</p>
                        <p className="text-emerald-400 font-semibold">
                          Entradas: +{payload[0]?.value || 0} un
                        </p>
                        <p className="text-rose-400 font-semibold">
                          Saídas: -{payload[1]?.value || 0} un
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                name="Entradas (+)"
                dataKey="entradas"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorEntradas)"
              />
              <Area
                type="monotone"
                name="Saídas (-)"
                dataKey="saidas"
                stroke="#ef4444"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorSaidas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
