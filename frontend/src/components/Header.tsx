import React, { useState } from 'react';
import { UtensilsCrossed, Building2, Bell, ShieldCheck, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'text-orange-400',
  ADMIN: 'text-orange-400',
  MANAGER: 'text-blue-400',
  WAITER: 'text-green-400',
  COOK: 'text-yellow-400',
  INVENTORY_MANAGER: 'text-purple-400',
};

const ROLE_BG: Record<string, string> = {
  OWNER: 'from-orange-500 to-amber-600',
  ADMIN: 'from-orange-500 to-amber-600',
  MANAGER: 'from-blue-500 to-blue-600',
  WAITER: 'from-green-500 to-emerald-600',
  COOK: 'from-yellow-500 to-amber-500',
  INVENTORY_MANAGER: 'from-purple-500 to-violet-600',
};

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roleColor = ROLE_COLORS[user?.role || 'OWNER'] || 'text-orange-400';
  const roleBg = ROLE_BG[user?.role || 'OWNER'] || 'from-orange-500 to-amber-600';

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${roleBg} flex items-center justify-center shadow-lg shadow-orange-500/20`}>
          <UtensilsCrossed className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none tracking-tight text-white flex items-center gap-2">
            El Perrazazo Grill &amp; Bar
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
        {/* Notification bell */}
        <div className="relative">
          <button
            id="header-notifications-btn"
            className="h-9 w-9 rounded-lg border border-slate-800 bg-slate-800/50 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full ring-2 ring-slate-950"></span>
          </button>
        </div>

        <div className="h-6 w-px bg-slate-800"></div>

        {/* User menu */}
        <div className="relative">
          <button
            id="header-user-menu-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-1.5 transition-all duration-200 group"
          >
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${roleBg} flex items-center justify-center text-white shadow`}>
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs text-left">
              <p className="font-semibold text-slate-200 leading-tight">
                {user ? `${user.firstName} ${user.lastName}`.trim() : 'Guest'}
              </p>
              <p className={`text-[10px] ${roleColor} flex items-center gap-1 font-medium`}>
                <ShieldCheck className="w-3 h-3" />
                {user?.role || 'GUEST'}
              </p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-48 bg-slate-900 border border-slate-700/80 rounded-xl shadow-xl shadow-black/50 overflow-hidden animate-in">
                <div className="p-3 border-b border-slate-800">
                  <p className="text-xs font-semibold text-white">{user?.email}</p>
                  <p className={`text-[10px] ${roleColor} font-medium mt-0.5`}>{user?.role}</p>
                </div>
                <div className="p-1">
                  <button
                    id="header-logout-btn"
                    onClick={() => { logout(); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
