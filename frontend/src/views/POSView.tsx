import React, { useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingBag, Utensils, CheckCircle2, Clock } from 'lucide-react';
import { Product, DiningTable } from '../types';

const MOCK_TABLES: DiningTable[] = [
  { id: 't1', branchId: 'b1', number: 1, capacity: 2, status: 'AVAILABLE' },
  { id: 't2', branchId: 'b1', number: 2, capacity: 4, status: 'AVAILABLE' },
  { id: 't3', branchId: 'b1', number: 3, capacity: 4, status: 'OCCUPIED' },
  { id: 't4', branchId: 'b1', number: 4, capacity: 6, status: 'AVAILABLE' },
  { id: 't5', branchId: 'b1', number: 5, capacity: 2, status: 'OCCUPIED' },
  { id: 't6', branchId: 'b1', number: 6, capacity: 4, status: 'RESERVED' },
  { id: 't7', branchId: 'b1', number: 7, capacity: 4, status: 'AVAILABLE' },
  { id: 't8', branchId: 'b1', number: 8, capacity: 8, status: 'AVAILABLE' },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', restaurantId: 'r1', categoryId: 'c1', name: 'Classic Perrazazo Burger', sku: 'BURGER-001', price: 28900, description: '200g carne Angus, queso cheddar fundido, tocineta crocante', minimumStock: 20, status: 'AVAILABLE' },
  { id: 'p2', restaurantId: 'r1', categoryId: 'c1', name: 'Smoky BBQ Bacon Burger', sku: 'BURGER-002', price: 32900, description: 'Doble tocineta caramelizada, aros de cebolla, salsa BBQ ahumada', minimumStock: 15, status: 'AVAILABLE' },
  { id: 'p3', restaurantId: 'r1', categoryId: 'c1', name: 'Truffle Mushroom Burger', sku: 'BURGER-003', price: 34900, description: 'Champiñones salteados al vino, queso suizo y alioli de trufa', minimumStock: 10, status: 'AVAILABLE' },
  { id: 'p4', restaurantId: 'r1', categoryId: 'c2', name: 'Bife de Chorizo Premium 350g', sku: 'STEAK-001', price: 49900, description: 'Corte magro a la parrilla servido con chimichurri casero', minimumStock: 12, status: 'AVAILABLE' },
  { id: 'p5', restaurantId: 'r1', categoryId: 'c2', name: 'Baby Beef al Carbón 300g', sku: 'STEAK-002', price: 46900, description: 'Tierna carne de res a las brasas con papa rústica', minimumStock: 10, status: 'AVAILABLE' },
  { id: 'p6', restaurantId: 'r1', categoryId: 'c3', name: 'Papas Rústicas con Trufa', sku: 'SIDE-001', price: 16900, description: 'Papas doradas bañadas en aceite de trufa y queso parmesano', minimumStock: 25, status: 'AVAILABLE' },
  { id: 'p7', restaurantId: 'r1', categoryId: 'c4', name: 'Limonada de Coco Artesanal', sku: 'DRINK-001', price: 12900, description: 'Refrescante limonada cremosita con leche de coco', minimumStock: 30, status: 'AVAILABLE' },
  { id: 'p8', restaurantId: 'r1', categoryId: 'c4', name: 'Cerveza IPA Artesanal 500ml', sku: 'DRINK-002', price: 15900, description: 'Cerveza de la casa con notas cítricas y lupuladas', minimumStock: 40, status: 'AVAILABLE' },
];

interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export const POSView: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(MOCK_TABLES[2]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([
    { product: MOCK_PRODUCTS[0], quantity: 2, notes: 'Sin cebolla' },
    { product: MOCK_PRODUCTS[5], quantity: 1 },
  ]);
  const [orderSent, setOrderSent] = useState(false);

  const addToCart = (product: Product) => {
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

  const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const handleSendToKitchen = () => {
    if (cart.length === 0) return;
    setOrderSent(true);
    setTimeout(() => {
      setOrderSent(false);
      setCart([]);
    }, 2000);
  };

  const filteredProducts = MOCK_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-slate-950">
      {/* Left Column: Tables & Menu Grid */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* Floor Plan Tables */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-orange-500" /> Plano de Mesas (Sede Chapinero)
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {MOCK_TABLES.map((t) => {
              const isSelected = selectedTable?.id === t.id;
              const isOccupied = t.status === 'OCCUPIED';
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTable(t)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-orange-500/20 border-orange-500 text-orange-400 ring-2 ring-orange-500/30'
                      : isOccupied
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-sm">Mesa {t.number}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t.capacity} Ppersonas</p>
                  <span
                    className={`inline-block w-2 h-2 rounded-full mt-1.5 ${
                      isOccupied ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                    }`}
                  ></span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Search & Grid */}
        <div>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Catálogo de Productos
            </h2>
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre o SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="glass-panel rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-100 text-sm">{product.name}</h3>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                      {product.sku}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{product.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <p className="font-extrabold text-orange-400 text-base">
                    ${product.price.toLocaleString('es-CO')}
                  </p>
                  <button
                    onClick={() => addToCart(product)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition shadow-md shadow-orange-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Active Order Cart Sidebar */}
      <div className="w-96 border-l border-slate-800 bg-slate-900/40 p-5 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                {selectedTable ? `Comanda Mesa #${selectedTable.number}` : 'Nueva Comanda'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-orange-400" /> Mesero: Carlos León
              </p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-slate-400 hover:text-red-400 text-xs p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="mt-4 space-y-3 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                El carrito está vacío. Selecciona productos del menú.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{item.product.name}</p>
                      <p className="text-[11px] font-bold text-orange-400 mt-0.5">
                        ${(item.product.price * item.quantity).toLocaleString('es-CO')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-200 text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-200 text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded mt-2">
                      Nota: {item.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order Totals & Action */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Subtotal</span>
            <span>${total.toLocaleString('es-CO')}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Impuestos (INC 0%)</span>
            <span>$0</span>
          </div>
          <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800/80">
            <span>Total a Pagar</span>
            <span className="text-orange-400">${total.toLocaleString('es-CO')}</span>
          </div>

          <button
            onClick={handleSendToKitchen}
            disabled={cart.length === 0 || orderSent}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg ${
              orderSent
                ? 'bg-emerald-600 text-white'
                : cart.length > 0
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-orange-500/25'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {orderSent ? (
              <>
                <CheckCircle2 className="w-5 h-5" /> Enviado a Cocina!
              </>
            ) : (
              'Enviar Pedido a Cocina (KDS)'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
