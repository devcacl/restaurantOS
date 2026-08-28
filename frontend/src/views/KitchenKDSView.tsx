import React, { useState } from 'react';
import { ChefHat, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Order } from '../types';

const INITIAL_KDS_ORDERS: Order[] = [
  {
    id: 'ord-101',
    restaurantId: 'r1',
    branchId: 'b1',
    tableId: 't3',
    status: 'PREPARING',
    subtotal: 74700,
    total: 74700,
    notes: 'Sin cebolla en la hamburguesa classic',
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    table: { id: 't3', branchId: 'b1', number: 3, capacity: 4, status: 'OCCUPIED' },
    items: [
      { productId: 'p1', productName: 'Classic Perrazazo Burger', unitPrice: 28900, quantity: 2, subtotal: 57800, notes: 'Sin cebolla' },
      { productId: 'p6', productName: 'Papas Rústicas con Trufa', unitPrice: 16900, quantity: 1, subtotal: 16900 },
    ],
  },
  {
    id: 'ord-102',
    restaurantId: 'r1',
    branchId: 'b1',
    tableId: 't5',
    status: 'CONFIRMED',
    subtotal: 65800,
    total: 65800,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    table: { id: 't5', branchId: 'b1', number: 5, capacity: 2, status: 'OCCUPIED' },
    items: [
      { productId: 'p2', productName: 'Smoky BBQ Bacon Burger', unitPrice: 32900, quantity: 1, subtotal: 32900 },
      { productId: 'p2', productName: 'Truffle Mushroom Burger', unitPrice: 34900, quantity: 1, subtotal: 34900 },
    ],
  },
  {
    id: 'ord-103',
    restaurantId: 'r1',
    branchId: 'b1',
    tableId: 't1',
    status: 'READY',
    subtotal: 49900,
    total: 49900,
    createdAt: new Date(Date.now() - 22 * 60000).toISOString(),
    table: { id: 't1', branchId: 'b1', number: 1, capacity: 2, status: 'OCCUPIED' },
    items: [
      { productId: 'p4', productName: 'Bife de Chorizo Premium 350g', unitPrice: 49900, quantity: 1, subtotal: 49900, notes: 'Término Medio' },
    ],
  },
];

export const KitchenKDSView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(INITIAL_KDS_ORDERS);

  const updateStatus = (orderId: string, nextStatus: 'PREPARING' | 'READY' | 'COMPLETED') => {
    setOrders((prev) =>
      prev
        .map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
        .filter((o) => o.status !== 'COMPLETED'),
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">Por Preparar</span>;
      case 'PREPARING':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold animate-pulse">En Preparación</span>;
      case 'READY':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">Listo para Servir</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-orange-500" /> Pantalla de Cocina (KDS Board)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestión en tiempo real de tickets y pedidos por estación de cocina.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Pendientes: {orders.filter(o => o.status === 'CONFIRMED').length}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span> En Cocción: {orders.filter(o => o.status === 'PREPARING').length}
          </span>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`glass-panel rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xl ${
              order.status === 'READY'
                ? 'border-emerald-500/40 bg-emerald-950/10'
                : order.status === 'PREPARING'
                ? 'border-blue-500/40 bg-blue-950/10'
                : 'border-amber-500/40 bg-amber-950/10'
            }`}
          >
            <div>
              {/* Header */}
              <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
                <div>
                  <h3 className="font-extrabold text-lg text-white">
                    Mesa #{order.table?.number || 'Barra'}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">Ticket ID: #{order.id}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(order.status)}
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 justify-end font-medium">
                    <Clock className="w-3 h-3 text-orange-400" /> 12 min
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="p-4 space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between text-xs border-b border-slate-800/40 pb-2">
                    <div>
                      <p className="font-bold text-slate-100 text-sm">
                        <span className="text-orange-400 font-extrabold mr-1.5">{item.quantity}x</span>
                        {item.productName}
                      </p>
                      {item.notes && (
                        <p className="text-[11px] text-amber-300 font-medium bg-amber-500/10 px-2 py-0.5 rounded mt-1">
                          ⚠️ {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {order.notes && (
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <span className="font-bold text-orange-400">Nota general:</span> {order.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Action Footer */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
              {order.status === 'CONFIRMED' && (
                <button
                  onClick={() => updateStatus(order.id, 'PREPARING')}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  Iniciar Preparación <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {order.status === 'PREPARING' && (
                <button
                  onClick={() => updateStatus(order.id, 'READY')}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle className="w-4 h-4" /> Marcar como Listo
                </button>
              )}

              {order.status === 'READY' && (
                <button
                  onClick={() => updateStatus(order.id, 'COMPLETED')}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  Entregado a Mesero
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
