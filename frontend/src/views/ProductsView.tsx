import React, { useState } from 'react';
import { BookOpen, Plus, Search, Tag, Edit, Trash2 } from 'lucide-react';
import { Product } from '../types';

const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', restaurantId: 'r1', categoryId: 'c1', name: 'Classic Perrazazo Burger', sku: 'BURGER-001', price: 28900, description: '200g carne Angus, queso cheddar fundido, tocineta crocante', minimumStock: 20, status: 'AVAILABLE' },
  { id: 'p2', restaurantId: 'r1', categoryId: 'c1', name: 'Smoky BBQ Bacon Burger', sku: 'BURGER-002', price: 32900, description: 'Doble tocineta caramelizada, aros de cebolla, salsa BBQ ahumada', minimumStock: 15, status: 'AVAILABLE' },
  { id: 'p3', restaurantId: 'r1', categoryId: 'c1', name: 'Truffle Mushroom Burger', sku: 'BURGER-003', price: 34900, description: 'Champiñones salteados al vino, queso suizo y alioli de trufa', minimumStock: 10, status: 'AVAILABLE' },
  { id: 'p4', restaurantId: 'r1', categoryId: 'c2', name: 'Bife de Chorizo Premium 350g', sku: 'STEAK-001', price: 49900, description: 'Corte magro a la parrilla servido con chimichurri casero', minimumStock: 12, status: 'AVAILABLE' },
  { id: 'p5', restaurantId: 'r1', categoryId: 'c2', name: 'Baby Beef al Carbón 300g', sku: 'STEAK-002', price: 46900, description: 'Tierna carne de res a las brasas con papa rústica', minimumStock: 10, status: 'AVAILABLE' },
  { id: 'p6', restaurantId: 'r1', categoryId: 'c3', name: 'Papas Rústicas con Trufa', sku: 'SIDE-001', price: 16900, description: 'Papas doradas bañadas en aceite de trufa y queso parmesano', minimumStock: 25, status: 'AVAILABLE' },
  { id: 'p7', restaurantId: 'r1', categoryId: 'c4', name: 'Limonada de Coco Artesanal', sku: 'DRINK-001', price: 12900, description: 'Refrescante limonada cremosita con leche de coco', minimumStock: 30, status: 'AVAILABLE' },
  { id: 'p8', restaurantId: 'r1', categoryId: 'c4', name: 'Cerveza IPA Artesanal 500ml', sku: 'DRINK-002', price: 15900, description: 'Cerveza de la casa con notas cítricas y lupuladas', minimumStock: 40, status: 'AVAILABLE' },
];

export const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [newProd, setNewProd] = useState({
    name: '',
    sku: '',
    price: 0,
    description: '',
    minimumStock: 10,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.sku || newProd.price <= 0) return;

    const created: Product = {
      id: `p-${Date.now()}`,
      restaurantId: 'r1',
      categoryId: 'c1',
      name: newProd.name,
      sku: newProd.sku,
      price: Number(newProd.price),
      description: newProd.description,
      minimumStock: Number(newProd.minimumStock),
      status: 'AVAILABLE',
    };

    setProducts([created, ...products]);
    setShowModal(false);
    setNewProd({ name: '', sku: '', price: 0, description: '', minimumStock: 10 });
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-orange-500" /> Catálogo de Menú & Productos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de artículos, precios, SKUs únicos por tenant y stock mínimo.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" /> Nuevo Producto
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Buscar producto por nombre o SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-4">Producto</th>
              <th className="p-4">SKU</th>
              <th className="p-4">Precio</th>
              <th className="p-4">Stock Mínimo</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((product) => (
              <tr key={product.id} className="hover:bg-slate-900/40 transition">
                <td className="p-4">
                  <p className="font-bold text-white text-sm">{product.name}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{product.description}</p>
                </td>
                <td className="p-4 font-mono font-semibold text-slate-300">
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px]">{product.sku}</span>
                </td>
                <td className="p-4 font-bold text-orange-400">
                  ${product.price.toLocaleString('es-CO')}
                </td>
                <td className="p-4 text-slate-400">{product.minimumStock} unidades</td>
                <td className="p-4">
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    DISPONIBLE
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded bg-slate-800 hover:bg-red-500/20 text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-orange-500" /> Crear Nuevo Producto
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  value={newProd.name}
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  placeholder="Ej. Doble Queso Smash"
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">SKU Único</label>
                  <input
                    type="text"
                    required
                    value={newProd.sku}
                    onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
                    placeholder="BURGER-005"
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Precio ($ COP)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={newProd.price}
                    onChange={(e) => setNewProd({ ...newProd, price: Number(e.target.value) })}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Descripción</label>
                <textarea
                  value={newProd.description}
                  onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
