import React, { useState, useEffect } from 'react';
import { Boxes, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2, Search } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface InventoryItem {
  id: string;
  branchId: string;
  productId: string;
  quantity: number;
  minimumStock: number;
  product: Product;
}

interface Branch {
  id: string;
  name: string;
}

export const InventoryView: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isSubmittingId, setIsSubmittingId] = useState<string | null>(null);

  const loadBranchesAndInventory = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      let restId = user.restaurantId;
      if (!restId) {
        const userRestRes = await apiFetch<{ data: Array<{ id: string }> }>('/restaurants');
        const userRestList = userRestRes.data || [];
        if (userRestList.length > 0) restId = userRestList[0].id;
      }

      if (restId) {
        const restRes = await apiFetch<{ data: { branches: Branch[] } }>(`/restaurants/${restId}`);
        const branchList = restRes.data?.branches || [];
        setBranches(branchList);

        let branchId = user.branchId || branchList[0]?.id || '';
        if (branchId) {
          setSelectedBranchId(branchId);
          await loadInventory(branchId);
        } else {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error loading inventory context:', err);
      setIsLoading(false);
    }
  };

  const loadInventory = async (branchId: string) => {
    if (!branchId) return;
    setIsLoading(true);
    try {
      const res = await apiFetch<{ data: InventoryItem[] }>(`/branches/${branchId}/inventory`);
      setItems(res.data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranchesAndInventory();
  }, [user?.restaurantId, user?.branchId]);

  const handleBranchChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bId = e.target.value;
    setSelectedBranchId(bId);
    if (!bId) return;
    await loadInventory(bId);
  };

  const handleAdjust = async (item: InventoryItem, delta: number, type: 'IN' | 'OUT') => {
    const targetBranchId = selectedBranchId || user?.branchId || branches[0]?.id;
    if (!targetBranchId) {
      alert('No hay una sede seleccionada.');
      return;
    }
    setIsSubmittingId(item.id);
    try {
      await apiFetch(`/branches/${targetBranchId}/inventory/movements`, {
        method: 'POST',
        body: JSON.stringify({
          productId: item.productId,
          type,
          quantity: Math.abs(delta),
          reason: 'Ajuste rápido desde panel de control',
        }),
      });
      // Refresh inventory after action
      await loadInventory(targetBranchId);
    } catch (err: any) {
      alert(err.message || 'Error al ajustar el inventario');
    } finally {
      setIsSubmittingId(null);
    }
  };

  const filtered = items.filter((item) => {
    const matchesSearch = item.product.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.product.sku.toLowerCase().includes(search.toLowerCase());
    const matchesLowStock = onlyLowStock ? item.quantity <= item.minimumStock : true;
    return matchesSearch && matchesLowStock;
  });

  const lowStockCount = items.filter((i) => i.quantity <= i.minimumStock).length;

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-orange-500" /> Control de Inventarios & Movimientos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitoreo en tiempo real de insumos y mercancía por sede con alertas automáticas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Branch selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sede:</span>
            <select
              value={selectedBranchId}
              onChange={handleBranchChange}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
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
            Solo Stock Bajo ({lowStockCount})
          </button>
        </div>
      </div>

      {/* Search & Refresh */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por insumo o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>
        
        <button
          onClick={() => loadInventory(selectedBranchId)}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          title="Recargar inventario"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-xs font-medium">Consultando stock del inventario...</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl shadow-black/30">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-4">Producto</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Stock Actual</th>
                <th className="p-4">Mínimo Requerido</th>
                <th className="p-4">Estado Stock</th>
                <th className="p-4 text-right">Ajuste de Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/20">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    El inventario está vacío para esta sede. Registra productos en el menú primero.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isLow = item.quantity <= item.minimumStock;
                  const isPending = isSubmittingId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-4">
                        <p className="font-extrabold text-white text-sm">{item.product.name}</p>
                      </td>
                      <td className="p-4 font-mono font-semibold text-slate-400">{item.product.sku}</td>
                      <td className="p-4">
                        <span className={`font-extrabold text-sm ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {item.quantity} unidades
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{item.minimumStock} unidades</td>
                      <td className="p-4">
                        {isLow ? (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3 text-amber-500 animate-pulse" /> STOCK BAJO
                          </span>
                        ) : (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold w-fit block">
                            NORMAL
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={isPending}
                            onClick={() => handleAdjust(item, 5, 'IN')}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-emerald-950 bg-slate-900/50 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 text-xs font-bold transition flex items-center gap-1"
                          >
                            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                            +5 In
                          </button>
                          <button
                            disabled={isPending}
                            onClick={() => handleAdjust(item, 5, 'OUT')}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-red-950 bg-slate-900/50 hover:bg-red-500/10 text-slate-300 hover:text-red-400 text-xs font-bold transition flex items-center gap-1"
                          >
                            <ArrowDownRight className="w-3 h-3 text-red-400" />
                            -5 Out
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
