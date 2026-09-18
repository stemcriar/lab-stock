import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  PlusCircle,
  ArrowLeftRight,
  FolderTree,
  FileSpreadsheet,
  FlaskConical,
  AlertTriangle,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { useToast } from '../../context/ToastContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { lowStockItems, items, movements, clearInventoryAndMovements } = useInventory();
  const { showToast } = useToast();

  // const handleClearData = async () => {
  //   if (
  //     window.confirm(
  //       'Tem certeza que deseja zerar todos os itens cadastrados e o histórico de movimentações no servidor SQLite?'
  //     )
  //   ) {
  //     try {
  //       await clearInventoryAndMovements();
  //       showToast('Estoque Limpo!', 'Todos os itens e histórico de movimentações foram apagados do banco de dados.', 'info');
  //       if (onCloseMobile) onCloseMobile();
  //     } catch (err: any) {
  //       showToast('Erro ao zerar', err.message || 'Falha na comunicação com o servidor.', 'error');
  //     }
  //   }
  // };

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: lowStockItems.length > 0 ? `${lowStockItems.length} alertas` : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      to: '/estoque',
      label: 'Estoque / Consulta',
      icon: Boxes,
      badge: items.length > 0 ? `${items.length}` : undefined,
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-400/30',
    },
    {
      to: '/cadastro',
      label: 'Cadastrar Item',
      icon: PlusCircle,
    },
    {
      to: '/movimentacoes',
      label: 'Movimentações',
      icon: ArrowLeftRight,
      badge: movements.length > 0 ? `${movements.length}` : undefined,
      badgeColor: 'bg-slate-700 text-slate-300',
    },
    {
      to: '/categorias-localizacoes',
      label: 'Categorias & Locais',
      icon: FolderTree,
    },
    {
      to: '/relatorios',
      label: 'Relatórios & Histórico',
      icon: FileSpreadsheet,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 border border-purple-400/30">
          <FlaskConical className="w-6 h-6 text-amber-300" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">
            LabStock
          </h1>
          <p className="text-xs text-purple-300/80 font-medium">STEM CRIAR</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Menu Principal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 shrink-0 opacity-80 group-hover:opacity-100 group-[.active]:text-amber-300" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Low stock reminder widget in sidebar */}
      {lowStockItems.length > 0 && (
        <div className="p-3 mx-3 mb-3 rounded-xl bg-rose-950/40 border border-rose-800/40">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-rose-300">
                {lowStockItems.length} {lowStockItems.length === 1 ? 'item precisa' : 'itens precisam'} de reposição!
              </p>
              <NavLink
                to="/estoque?status=baixo"
                onClick={onCloseMobile}
                className="text-[11px] text-amber-400 hover:underline mt-1 inline-block font-medium"
              >
                Ver itens críticos →
              </NavLink>
            </div>
          </div>
        </div>
      )}

      {/* Footer / Reset Actions */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {/* {items.length > 0 && (
          <button
            onClick={handleClearData}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors border border-slate-800 hover:border-rose-900/50"
            title="Apagar todos os itens e histórico de movimentações"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Zerar Estoque & Histórico</span>
          </button>
        )} */}
        <div className="px-3 py-1 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-medium text-slate-400">LabStock v1.0</span>
          <span className="flex items-center gap-1 text-slate-300 font-medium">
            <Sparkles className="w-3 h-3 text-amber-400" /> Lab Online
          </span>
        </div>
      </div>
    </aside>
  );
};
