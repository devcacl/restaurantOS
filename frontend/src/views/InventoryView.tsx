import React, { useState } from 'react';
import { Boxes, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { InventoryItem } from '../types';

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', branchId: 'b1', productId: 'p1', quantity: 35, minimumStock: 20, product: { id: 'p1', restaurantId: 'r1', categoryId: 'c1', name: 'Classic Perrazazo Burger', sku: 'BURGER-001', price: 28900, minimumStock: 20, status: 'AVAILABLE' } },
  { id: 'inv-2', branchId: 'b1', productId: 'p2', quantity: 8, minimumStock: 15, product: { id: 'p2', restaurantId: 'r1', categoryId: 'c1', name: 'Smoky BBQ Bacon Burger', sku: 'BURGER-002', price: 32900, minimumStock: 15, status: 'AVAILABLE' } },
  { id: 'inv-3', branchId: 'b1', productId: 'p3', quantity: 5, minimumStock: 10, product: { id: 'p3', restaurantId: 'r1', categoryId: 'c1', name: 'Truffle Mushroom Burger', sku: 'BURGER-003', price: 34900, minimumStock: 10, status: 'AVAILABLE' } },
  { id: 'inv-4', branchId: 'b1', productId: 'p4', quantity: 22, minimumStock: 12, product: { id: 'p4', restaurantId: 'r1', categoryId: 'c2', name: 'Bife de Chorizo Premium 350g', sku: 'STEAK-001', price: 49900, minimumStock: 12, status: 'AVAILABLE' } },
  { id: 'inv-5', branchId: 'b1', productId: 'p5', quantity: 18, minimumStock: 10, product: { id: 'p5', restaurantId: 'r1', categoryId: 'c2', name: 'Baby Beef al Carbón 300g', sku: 'STEAK-002', price: 46900, minimumStock: 10, status: 'AVAILABLE' } },
];

export const InventoryView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const handleAdjust = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)),
    );
  };

  const filtered = onlyLowStock
    ? items.filter((i) => i.quantity <= i.minimumStock)
    : items;

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-orange-500" /> Control de Inventarios & Movimientos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitoreo en tiempo real por sede con alertas de stock bajo.
          </p>
        </div>

        <button
          onClick={() => setOnlyLowStock(!onlyLowStock)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            onlyLowStock
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Solo Stock Bajo ({items.filter((i) => i.quantity <= i.minimumStock).length})
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-4">Producto</th>
              <th className="p-4">SKU</th>
              <th className="p-4">Stock Actual</th>
              <th className="p-4">Mínimo Requerido</th>
              <th className="p-4">Estado Stock</th>
              <th className="p-4 text-right">Ajuste Rápido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((item) => {
              const isLow = item.quantity <= item.minimumStock;
              return (
                <tr key={item.id} className="hover:bg-slate-900/40 transition">
                  <td className="p-4">
                    <p className="font-bold text-white text-sm">{item.product.name}</p>
                  </td>
                  <td className="p-4 font-mono text-slate-400">{item.product.sku}</td>
                  <td className="p-4">
                    <span className={`font-extrabold text-sm ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {item.quantity} unidades
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{item.minimumStock} unidades</td>
                  <td className="p-4">
                    {isLow ? (
                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> STOCK BAJO
                      </span>
                    ) : (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold w-fit block">
                        NORMAL
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleAdjust(item.id, 5)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 text-xs font-semibold"
                    >
                      +5 (Entrada)
                    </button>
                    <button
                      onClick={() => handleAdjust(item.id, -2)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 text-xs font-semibold"
                    >
                      -2 (Salida)
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
