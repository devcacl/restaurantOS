import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingBag, Utensils, CheckCircle2, Clock, Loader2, PlusCircle, AlertCircle } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  description?: string;
  status: string;
}

interface DiningTable {
  id: string;
  number: number;
  capacity: number;
  status: string;
}

interface Branch {
  id: string;
  name: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export const POSView: React.FC = () => {
  const { user } = useAuth();
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);
  
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tables creation modal state
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableCap, setNewTableCap] = useState('4');

  const loadInitialContext = async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      let restId = user.restaurantId;

      // Fallback: If user.restaurantId is missing, fetch user's accessible restaurants
      if (!restId) {
        const userRestRes = await apiFetch<{ data: Array<{ id: string }> }>('/restaurants');
        const userRestList = userRestRes.data || [];
        if (userRestList.length > 0) {
          restId = userRestList[0].id;
        }
      }

      if (restId) {
        const restRes = await apiFetch<{ data: { branches: Branch[] } }>(`/restaurants/${restId}`);
        const branchList = restRes.data?.branches || [];
        setBranches(branchList);

        const branchId = user.branchId || branchList[0]?.id || '';
        if (branchId) {
          setSelectedBranchId(branchId);
          await Promise.all([
            loadTables(branchId),
            loadProducts(restId)
          ]);
        } else {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al inicializar el POS');
      setIsLoading(false);
    }
  };

  const loadTables = async (branchId: string) => {
    if (!branchId) return;
    try {
      const res = await apiFetch<{ data: DiningTable[] }>(`/branches/${branchId}/tables`);
      const tblList = res.data || [];
      setTables(tblList);
      if (tblList.length > 0) {
        setSelectedTable(tblList[0]);
      } else {
        setSelectedTable(null);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  };

  const loadProducts = async (restId?: string) => {
    const targetRestId = restId || user?.restaurantId;
    if (!targetRestId) return;
    try {
      const res = await apiFetch<{ data: Product[] }>(`/restaurants/${targetRestId}/products`);
      setProducts(res.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialContext();
  }, [user?.restaurantId, user?.branchId]);

  const handleBranchChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bId = e.target.value;
    setSelectedBranchId(bId);
    if (!bId) return;
    setIsLoading(true);
    await loadTables(bId);
    setIsLoading(false);
  };

  const handleAddTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum) return;

    const targetBranchId = selectedBranchId || user?.branchId || branches[0]?.id;
    if (!targetBranchId) {
      setErrorMsg('No hay una sede activa seleccionada para crear la mesa.');
      return;
    }

    setErrorMsg('');
    try {
      await apiFetch(`/branches/${targetBranchId}/tables`, {
        method: 'POST',
        body: JSON.stringify({
          number: Number(newTableNum),
          capacity: Number(newTableCap),
        }),
      });
      setShowAddTable(false);
      setNewTableNum('');
      await loadTables(targetBranchId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al agregar la mesa');
    }
  };

  const addToCart = (product: Product) => {
    if (product.status !== 'AVAILABLE') return;
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const updateItemNotes = (productId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, notes } : item)),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const handleSendToKitchen = async () => {
    if (cart.length === 0 || !selectedTable) return;

    const targetBranchId = selectedBranchId || user?.branchId || branches[0]?.id;
    if (!targetBranchId) {
      setErrorMsg('No hay una sede seleccionada.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      // 1. Send order to backend
      const orderPayload = {
        tableId: selectedTable.id,
        notes: orderNotes,
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
          notes: c.notes || '',
        })),
      };

      await apiFetch(`/branches/${targetBranchId}/orders`, {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      // 2. Mark table as OCCUPIED
      await apiFetch(`/tables/${selectedTable.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'OCCUPIED' }),
      });

      setOrderSent(true);
      setCart([]);
      setOrderNotes('');
      
      // Reload tables to show occupied status
      await loadTables(targetBranchId);

      setTimeout(() => {
        setOrderSent(false);
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al enviar el pedido a cocina');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLiberateTable = async (tableId: string) => {
    if (!window.confirm('¿Liberar mesa y limpiarla?')) return;
    try {
      await apiFetch(`/tables/${tableId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'AVAILABLE' }),
      });
      await loadTables(selectedBranchId);
    } catch (err: any) {
      alert(err.message || 'Error al liberar la mesa');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-slate-950">
      {/* Left Column: Tables & Menu Grid */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Floor Plan Tables */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-orange-500" /> Distribución de Mesas
            </h2>

            <div className="flex items-center gap-3">
              {/* Branch select */}
              <select
                value={selectedBranchId}
                onChange={handleBranchChange}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowAddTable(true)}
                className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Agregar Mesa
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-slate-500 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> Cargando plano de mesas...
            </div>
          ) : tables.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-slate-850 text-center text-xs text-slate-500 italic">
              No hay mesas configuradas para esta sede. ¡Haz clic en Agregar Mesa para empezar!
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
              {tables.map((t) => {
                const isSelected = selectedTable?.id === t.id;
                const isOccupied = t.status === 'OCCUPIED';
                return (
                  <div key={t.id} className="relative group">
                    <button
                      onClick={() => setSelectedTable(t)}
                      className={`w-full h-16 rounded-xl border flex flex-col items-center justify-center transition-all duration-150 ${
                        isSelected
                          ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-orange-400 border-orange-500/50 shadow shadow-orange-500/10'
                          : isOccupied
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : 'bg-slate-900/60 text-slate-300 border-slate-850 hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-xs font-extrabold">Mesa {t.number}</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">{t.capacity} puestos</span>
                      <span className={`text-[8px] uppercase tracking-wider font-extrabold mt-1 px-1.5 py-0.2 rounded-full ${
                        isOccupied ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {isOccupied ? 'Ocupada' : 'Libre'}
                      </span>
                    </button>
                    {isOccupied && (
                      <button
                        onClick={() => handleLiberateTable(t.id)}
                        className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 text-[8px] opacity-0 group-hover:opacity-100 transition duration-150"
                        title="Liberar mesa"
                      >
                        ✔
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Search menu */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-orange-500" /> Carta & Menú disponible
            </h2>
            <div className="relative max-w-xs flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar platillo o bebida..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-slate-500 text-xs gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" /> Cargando menú...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic border border-dashed border-slate-850 rounded-xl">
              No hay productos cargados en el menú. Visita "Menú & Productos" para registrar artículos.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const isAgotado = product.status !== 'AVAILABLE';
                return (
                  <button
                    key={product.id}
                    disabled={isAgotado}
                    onClick={() => addToCart(product)}
                    className={`glass-panel p-4 rounded-2xl border text-left flex flex-col justify-between h-32 transition duration-150 group ${
                      isAgotado
                        ? 'border-slate-850/50 bg-slate-950/20 opacity-50 cursor-not-allowed'
                        : 'border-slate-850 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-extrabold text-xs text-slate-100 group-hover:text-orange-400 transition-colors line-clamp-1">{product.name}</h3>
                        <span className="text-[10px] bg-slate-950 border border-slate-800 px-1.5 py-0.2 rounded font-mono text-slate-400">{product.sku}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{product.description || 'Sin descripción'}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-850/60">
                      <span className="font-extrabold text-orange-400 text-sm">${product.price.toLocaleString('es-CO')}</span>
                      <span className="text-[9px] text-orange-500 font-bold group-hover:translate-x-1 transition duration-150">
                        {isAgotado ? 'Agotado' : '+ Agregar'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Active Order Cart */}
      <div className="w-80 border-l border-slate-800/80 bg-slate-900/20 flex flex-col justify-between shrink-0 h-full p-5 space-y-4">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-850">
            <h3 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-orange-500" /> Pedido actual
            </h3>
            {selectedTable ? (
              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-extrabold border border-orange-500/30 animate-pulse">
                Mesa {selectedTable.number}
              </span>
            ) : (
              <span className="text-xs text-slate-500 italic">Mesa no elegida</span>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto mt-4 space-y-3 min-h-0 pr-1">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 p-4 gap-2">
                <Utensils className="w-8 h-8 text-slate-600 animate-bounce" />
                <p className="text-xs italic text-center">El pedido está vacío. Elige productos del menú.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2">
                  <div className="flex items-start justify-between gap-1 text-xs">
                    <div>
                      <p className="font-extrabold text-slate-200">{item.product.name}</p>
                      <p className="text-[10px] text-orange-400 font-bold">${item.product.price.toLocaleString('es-CO')}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quantity controls & item notes */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-850/60">
                    <input
                      type="text"
                      placeholder="Nota (ej. sin sal...)"
                      value={item.notes || ''}
                      onChange={(e) => updateItemNotes(item.product.id, e.target.value)}
                      className="bg-slate-900 border border-slate-850 rounded px-2 py-0.5 text-[9px] text-slate-300 w-28 focus:outline-none focus:border-orange-500"
                    />

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono font-bold text-slate-200">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Button & Total */}
        <div className="pt-4 border-t border-slate-850 space-y-3 bg-slate-950/20">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Instrucciones de Cocina</label>
            <input
              type="text"
              placeholder="Notas generales (ej. servir rápido)..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total a pagar:</span>
            <span className="text-lg font-extrabold text-orange-400">${total.toLocaleString('es-CO')}</span>
          </div>

          {orderSent ? (
            <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> ¡Pedido enviado a cocina!
            </div>
          ) : (
            <button
              onClick={handleSendToKitchen}
              disabled={cart.length === 0 || !selectedTable || isSubmitting}
              className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              Enviar Comanda a Cocina
            </button>
          )}
        </div>
      </div>

      {/* Add Table Modal */}
      {showAddTable && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-850 flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-orange-500" />
                Registrar Nueva Mesa
              </h3>
              <button
                onClick={() => setShowAddTable(false)}
                className="text-xs text-slate-500 hover:text-slate-300 font-bold"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleAddTableSubmit} className="p-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Número de Mesa *</label>
                <input
                  type="number"
                  required
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  placeholder="Ej. 11"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Capacidad (Comensales) *</label>
                <select
                  value={newTableCap}
                  onChange={(e) => setNewTableCap(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="2">2 personas</option>
                  <option value="4">4 personas</option>
                  <option value="6">6 personas</option>
                  <option value="8">8 personas</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddTable(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
