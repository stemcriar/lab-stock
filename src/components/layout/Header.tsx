import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Plus,
  ArrowLeftRight,
  AlertTriangle,
  FlaskConical,
  Database,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Button } from '../common/Button';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const navigate = useNavigate();
  const { lowStockItems, isOnline, isLoading } = useInventory();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
      {/* Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-slate-700 text-xs font-medium">
          <div className="p-1 rounded-md bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
            <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <span className="font-bold text-slate-800">Laboratório de Prototipagem - STEM CRIAR</span>
          <span className="text-slate-300">|</span>
          <span
            className={`font-semibold flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
            title={isOnline ? 'Conectado ao Servidor SQLite' : 'Falha na conexão com o servidor'}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Database className="w-3 h-3 text-emerald-600" />
                <span>SQLite Conectado</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-rose-500" />
                <span>Servidor Desconectado</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Low stock alert badge */}
        {lowStockItems.length > 0 && (
          <button
            onClick={() => navigate('/estoque?status=baixo')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition-colors shadow-sm animate-in fade-in"
          >
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{lowStockItems.length} {lowStockItems.length === 1 ? 'Alerta Crítico' : 'Alertas Críticos'}</span>
          </button>
        )}

        {/* Quick Action: New Movement */}
        <Button
          variant="outline"
          size="sm"
          icon={<ArrowLeftRight className="w-4 h-4 text-purple-600" />}
          onClick={() => navigate('/movimentacoes')}
          className="hidden sm:inline-flex border-purple-200 hover:bg-purple-50 text-purple-700"
        >
          Movimentar
        </Button>

        {/* Quick Action: New Item */}
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/cadastro')}
        >
          Novo Item
        </Button>
      </div>
    </header>
  );
};
