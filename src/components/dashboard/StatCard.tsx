import React from 'react';
import { Card } from '../common/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label: string;
  };
  onClick?: () => void;
  alert?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-purple-50 text-purple-600 border border-purple-100',
  trend,
  onClick,
  alert = false,
}) => {
  return (
    <Card
      onClick={onClick}
      className={`relative overflow-hidden transition-all ${
        alert ? 'border-rose-300 ring-2 ring-rose-500/20 bg-rose-50/20' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </div>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`font-semibold ${
                  trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {trend.value}
              </span>
              <span className="text-slate-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${iconBgColor} shrink-0 shadow-xs`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};
