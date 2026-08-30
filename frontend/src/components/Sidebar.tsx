import React from 'react';
import {
  Store,
  ChefHat,
  BookOpen,
  Boxes,
  Truck,
  BarChart3,
  ShieldCheck,
  Layers,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'pos', label: 'POS & Mesas', icon: Store },
    { id: 'kds', label: 'Cocina (KDS)', icon: ChefHat },
    { id: 'menu', label: 'Menú & Productos', icon: BookOpen },
    { id: 'inventory', label: 'Inventarios', icon: Boxes },
    { id: 'purchases', label: 'Compras & Proveedores', icon: Truck },
    { id: 'dashboard', label: 'Dashboard & KPI', icon: BarChart3 },
    { id: 'audit', label: 'Auditoría & Logs', icon: ShieldCheck },
  ];

  // Conditionally show staff management tab for OWNER or ADMIN roles
  if (user?.role === 'OWNER' || user?.role === 'ADMIN') {
    navItems.push({ id: 'staff', label: 'Gestión de Personal', icon: Users });
  }

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Módulos del Sistema
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-orange-400 border border-orange-500/30 shadow-md shadow-orange-500/5 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="glass-card rounded-xl p-3.5 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Layers className="w-4 h-4 text-orange-400" />
          <span>Tenant Context</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Aislamiento garantizado por NestJS TenantGuard.
        </p>
      </div>
    </aside>
  );
};
