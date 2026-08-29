import React, { useState } from 'react';
import { ShieldCheck, FileText, User, Calendar, Activity } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [logs] = useState([
    {
      id: 'log-101',
      user: 'Carlos León (OWNER)',
      action: 'CREATE',
      entity: 'ORDER',
      entityId: 'ord-101',
      details: 'Creada comanda en Mesa #3 por $74.700',
      timestamp: '2026-08-28 13:45:10',
    },
    {
      id: 'log-102',
      user: 'Carlos León (OWNER)',
      action: 'UPDATE',
      entity: 'INVENTORY',
      entityId: 'inv-2',
      details: 'Ajuste manual de inventario: +5 unidades en "Smoky BBQ Bacon Burger"',
      timestamp: '2026-08-28 13:20:05',
    },
    {
      id: 'log-103',
      user: 'Carlos León (OWNER)',
      action: 'STATUS_CHANGE',
      entity: 'ORDER',
      entityId: 'ord-103',
      details: 'Transición de estado: PREPARING -> READY',
      timestamp: '2026-08-28 12:50:33',
    },
    {
      id: 'log-104',
      user: 'Carlos León (OWNER)',
      action: 'CREATE',
      entity: 'PURCHASE',
      entityId: 'po-901',
      details: 'Orden de Compra recibida de Proveedor "Distribuciones Carnes S.A.S."',
      timestamp: '2026-08-27 16:15:00',
    },
  ]);

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-[calc(100vh-4rem)]">
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-orange-500" /> Registro de Trazabilidad & Audit Logs
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Historial inmutable de cambios y mutaciones operativas capturadas automáticamente por AuditLogInterceptor.
        </p>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-4">Fecha & Hora</th>
              <th className="p-4">Usuario</th>
              <th className="p-4">Acción</th>
              <th className="p-4">Entidad</th>
              <th className="p-4">Detalle de Operación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-900/40 transition">
                <td className="p-4 text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> {log.timestamp}
                </td>
                <td className="p-4 font-semibold text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-400" /> {log.user}
                </td>
                <td className="p-4">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-extrabold ${
                      log.action === 'CREATE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : log.action === 'UPDATE' || log.action === 'STATUS_CHANGE'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="p-4 font-mono text-slate-300 font-semibold">{log.entity}</td>
                <td className="p-4 text-slate-300 font-medium">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
