import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Tag, Edit, Trash2, Loader2, FolderPlus, AlertCircle } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Product {
  id: string;
  categoryId: string;
  name: string;
  sku: string;
  price: number;
  description?: string;
  minimumStock: number;
  status: string;
  category?: Category;
}

export const ProductsView: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [newProd, setNewProd] = useState({
    name: '',
    sku: '',
    price: 15000,
    description: '',
    categoryId: '',
    minimumStock: 10,
  });

  const [newCat, setNewCat] = useState({
    name: '',
    description: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      let restId = user?.restaurantId;
      if (!restId) {
        const userRestRes = await apiFetch<{ data: Array<{ id: string }> }>('/restaurants');
        const userRestList = userRestRes.data || [];
        if (userRestList.length > 0) restId = userRestList[0].id;
      }

      if (!restId) {
        setIsLoading(false);
        return;
      }

      // 1. Fetch categories
      const catRes = await apiFetch<{ data: Category[] }>(`/restaurants/${restId}/categories`);
      setCategories(catRes.data || []);

      // 2. Fetch products
      const prodRes = await apiFetch<{ data: Product[] }>(`/restaurants/${restId}/products`);
      setProducts(prodRes.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cargar el catálogo de menú');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.restaurantId]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.sku || !newProd.categoryId || newProd.price <= 0) {
      setErrorMsg('Por favor rellena todos los campos obligatorios.');
      return;
    }

    let restId = user?.restaurantId;
    if (!restId) {
      const userRestRes = await apiFetch<{ data: Array<{ id: string }> }>('/restaurants');
      restId = userRestRes.data?.[0]?.id;
    }

    if (!restId) {
      setErrorMsg('No hay un restaurante seleccionado.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await apiFetch(`/restaurants/${restId}/products`, {
        method: 'POST',
        body: JSON.stringify(newProd),
      });
      setShowProductModal(false);
      setNewProd({
        name: '',
        sku: '',
        price: 15000,
        description: '',
        categoryId: '',
        minimumStock: 10,
      });
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name) {
      setErrorMsg('El nombre de la categoría es obligatorio.');
      return;
    }

    let restId = user?.restaurantId;
    if (!restId) {
      const userRestRes = await apiFetch<{ data: Array<{ id: string }> }>('/restaurants');
      restId = userRestRes.data?.[0]?.id;
    }

    if (!restId) {
      setErrorMsg('No hay un restaurante seleccionado.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await apiFetch<{ data: Category }>(`/restaurants/${restId}/categories`, {
        method: 'POST',
        body: JSON.stringify(newCat),
      });
      setShowCategoryModal(false);
      setNewCat({ name: '', description: '' });
      await loadData();
      if (res.data) {
        setNewProd((prev) => ({ ...prev, categoryId: res.data.id }));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear la categoría');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el producto');
    }
  };

  const handleOpenProductModal = () => {
    if (categories.length === 0) {
      alert('Debes crear al menos una categoría antes de poder crear productos.');
      setShowCategoryModal(true);
      return;
    }
    setNewProd({
      name: '',
      sku: '',
      price: 15000,
      description: '',
      categoryId: categories[0]?.id || '',
      minimumStock: 10,
    });
    setErrorMsg('');
    setShowProductModal(true);
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
            Gestión de artículos, categorías, precios y stock mínimo integrados en tu base de datos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setErrorMsg(''); setShowCategoryModal(true); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold text-xs transition"
          >
            <FolderPlus className="w-4 h-4 text-orange-400" /> Nueva Categoría
          </button>
          <button
            onClick={handleOpenProductModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-xs font-medium">Cargando menú y productos...</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl shadow-black/30">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-4">Producto</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Precio</th>
                <th className="p-4">Stock Mínimo</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/20">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                    No se encontraron productos registrados. Crea categorías y productos para empezar.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-4">
                      <p className="font-extrabold text-white text-sm">{product.name}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{product.description || 'Sin descripción'}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-300 font-semibold text-[10px]">
                        {product.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-300">
                      <span className="bg-slate-900 px-2 py-0.5 rounded text-[11px] border border-slate-800">{product.sku}</span>
                    </td>
                    <td className="p-4 font-extrabold text-orange-400">
                      ${Number(product.price).toLocaleString('es-CO')}
                    </td>
                    <td className="p-4 text-slate-400">{product.minimumStock} unidades</td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold border ${
                        product.status === 'AVAILABLE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {product.status === 'AVAILABLE' ? 'DISPONIBLE' : 'AGOTADO'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-1.5 rounded-lg border border-slate-800 hover:border-red-950 bg-slate-900/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Form Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-orange-500" /> Registrar Nuevo Producto
            </h3>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={newProd.name}
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  placeholder="Ej. Hamburguesa Doble Queso"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Categoría *</label>
                <select
                  required
                  value={newProd.categoryId}
                  onChange={(e) => setNewProd({ ...newProd, categoryId: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">SKU Único *</label>
                  <input
                    type="text"
                    required
                    value={newProd.sku}
                    onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
                    placeholder="Ej. PROD-101"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Precio ($ COP) *</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={newProd.price}
                    onChange={(e) => setNewProd({ ...newProd, price: Number(e.target.value) })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Stock Mínimo Alerta *</label>
                <input
                  type="number"
                  required
                  value={newProd.minimumStock}
                  onChange={(e) => setNewProd({ ...newProd, minimumStock: Number(e.target.value) })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Descripción</label>
                <textarea
                  value={newProd.description}
                  onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                  placeholder="Ingredientes o notas adicionales..."
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition shadow-lg shadow-orange-500/20"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-orange-500" /> Crear Nueva Categoría
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre de la Categoría *</label>
                <input
                  type="text"
                  required
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                  placeholder="Ej. Hamburguesas Gourmet, Bebidas..."
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Descripción</label>
                <textarea
                  value={newCat.description}
                  onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                  placeholder="Descripción corta de la categoría..."
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition shadow-lg shadow-orange-500/20"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Crear Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
