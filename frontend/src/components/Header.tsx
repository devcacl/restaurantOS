import React from 'react';
import { UtensilsCrossed, Building2, Bell, ShieldCheck, User } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <UtensilsCrossed className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none tracking-tight text-white flex items-center gap-2">
            El Perrazazo Grill & Bar
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
              Multi-Tenant POS
            </span>
          </h1>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <Building2 className="w-3 h-3 text-slate-400" /> Sede Chapinero Central
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button className="h-9 w-9 rounded-lg border border-slate-800 bg-slate-800/50 flex items-center justify-center text-slate-300 hover:text-white transition">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full ring-2 ring-slate-950"></span>
          </button>
        </div>

        <div className="h-6 w-px bg-slate-800"></div>

        <div className="flex items-center gap-2.5 bg-slate-800/40 border border-slate-800 rounded-lg px-3 py-1.5">
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-200">
            <User className="w-4 h-4" />
          </div>
          <div className="text-xs text-left">
            <p className="font-semibold text-slate-200 leading-tight">Carlos León</p>
            <p className="text-[10px] text-orange-400 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3 h-3" /> OWNER
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
