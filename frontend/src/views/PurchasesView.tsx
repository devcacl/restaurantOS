import React, { useState } from 'react';
import { Truck, Plus, CheckCircle, Clock } from 'lucide-react';

export const PurchasesView: React.FC = () => {
  const [purchases, setPurchases] = useState([
    {
      id: 'po-901',
      supplier: 'Distribuciones Carnes & Parrilla S.A.S.',
      itemsCount: 4,
      total: 1250000,
      status: 'ORDERED',
      createdAt: '2026-08-27',
    },
    {
      id: 'po-902',
      supplier: 'Lácteos & Panadería Brioche Bogotá',
      itemsCount: 2,
      total: 480000,
      status: 'RECEIVED',
      createdAt: '2026-08-25',
    },
  ]);

  const handleReceive = (id: string) => {
    setPurchases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'RECEIVED' } : p)),
    );
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-orange-500" /> Compras & Proveedores
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Recepción de órdenes de compra con ingreso automático a inventario (Stock IN).
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition shadow-lg shadow-orange-500/20">
          <Plus className="w-4 h-4" /> Nueva Orden de Compra
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-4">Orden ID</th>
              <th className="p-4">Proveedor</th>
              <th className="p-4">Total</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {purchases.map((po) => (
              <tr key={po.id} className="hover:bg-slate-900/40 transition">
                <td className="p-4 font-mono font-bold text-slate-200">#{po.id}</td>
                <td className="p-4 font-semibold text-white">{po.supplier}</td>
                <td className="p-4 font-bold text-orange-400">
                  ${po.total.toLocaleString('es-CO')}
                </td>
                <td className="p-4 text-slate-400">{po.createdAt}</td>
                <td className="p-4">
                  {po.status === 'RECEIVED' ? (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit">
                      <CheckCircle className="w-3 h-3" /> RECIBIDA (Stock IN)
                    </span>
                  ) : (
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit">
                      <Clock className="w-3 h-3" /> ORDENADA (Pendiente)
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {po.status !== 'RECEIVED' && (
                    <button
                      onClick={() => handleReceive(po.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow"
                    >
                      Recibir Mercancía
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
