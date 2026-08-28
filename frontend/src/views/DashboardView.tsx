import React from 'react';
import { BarChart3, TrendingUp, ShoppingBag, Utensils, AlertTriangle, DollarSign } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const CHART_DATA = [
  { date: 'Lun', sales: 1450000 },
  { date: 'Mar', sales: 1820000 },
  { date: 'Mié', sales: 1950000 },
  { date: 'Jue', sales: 2200000 },
  { date: 'Vie', sales: 3100000 },
  { date: 'Sáb', sales: 3850000 },
  { date: 'Dom', sales: 2900000 },
];

export const DashboardView: React.FC = () => {
  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-[calc(100vh-4rem)]">
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-orange-500" /> Dashboard & Analítica de Ventas
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Resumen ejecutivo de ingresos, pedidos procesados, ticket promedio y alertas operative.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ventas Totales</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">$17.270.000</h3>
            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +14.2% esta semana
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pedidos Atendidos</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">428</h3>
            <span className="text-[10px] text-slate-400 mt-1 block">94.5% completados</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ticket Promedio</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">$40.350</h3>
            <span className="text-[10px] font-bold text-emerald-400 mt-1 block">+5.8% vs mes anterior</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Utensils className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alertas Inventario</p>
            <h3 className="text-2xl font-extrabold text-amber-400 mt-1">2 Productos</h3>
            <span className="text-[10px] text-amber-400 font-semibold mt-1 block">Requieren reabastecimiento</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Chart & Top Sellers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Area Chart */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="font-bold text-sm text-white mb-4">Comportamiento de Ingresos Semanales ($ COP)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v / 1000000}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString('es-CO')}`, 'Venta']}
                />
                <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Sellers list */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="font-bold text-sm text-white mb-4">Top 5 Más Vendidos</h3>
          <div className="space-y-3">
            {[
              { name: 'Classic Perrazazo Burger', qty: 324, revenue: '$9.363.600' },
              { name: 'Smoky BBQ Bacon Burger', qty: 240, revenue: '$7.896.000' },
              { name: 'Bife de Chorizo 350g', qty: 185, revenue: '$9.231.500' },
              { name: 'Limonada de Coco', qty: 410, revenue: '$5.289.000' },
              { name: 'Cerveza IPA Artesanal', qty: 380, revenue: '$6.042.000' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div>
                  <p className="font-semibold text-slate-200">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.qty} unidades vendidas</p>
                </div>
                <span className="font-extrabold text-orange-400">{item.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
