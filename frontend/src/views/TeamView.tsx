import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Search, Edit2, Trash2, Users, Loader2, Mail, Phone, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  status: string;
  createdAt: string;
  role: {
    id: string;
    name: string;
    description: string;
  };
  branches: Array<{
    id: string;
    name: string;
    address?: string;
  }>;
}

interface Branch {
  id: string;
  name: string;
  address?: string;
}

export const TeamView: React.FC = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    roleName: 'WAITER',
    branchId: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // 1. Load users
      const staffRes = await apiFetch<{ data: StaffMember[] }>('/users');
      setStaff(staffRes.data || []);

      // 2. Load restaurant branches
      if (user?.restaurantId) {
        const restRes = await apiFetch<{ data: { branches: Branch[] } }>(`/restaurants/${user.restaurantId}`);
        setBranches(restRes.data?.branches || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cargar los datos del equipo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.restaurantId]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      roleName: 'WAITER',
      branchId: branches[0]?.id || '',
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (member: StaffMember) => {
    setEditingId(member.id);
    setForm({
      email: member.email,
      password: '', // blank password unless modifying
      firstName: member.firstName,
      lastName: member.lastName,
      phone: member.phone || '',
      roleName: member.role.name,
      branchId: member.branches[0]?.id || '',
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.firstName || !form.lastName || (!editingId && !form.password)) {
      setErrorMsg('Por favor completa todos los campos requeridos.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      if (editingId) {
        // Update user
        const updatePayload: any = {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          roleName: form.roleName,
          branchId: form.branchId || null,
        };
        if (form.password) {
          updatePayload.password = form.password;
        }

        await apiFetch(`/users/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(updatePayload),
        });
      } else {
        // Create user
        await apiFetch('/users', {
          method: 'POST',
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            roleName: form.roleName,
            branchId: form.branchId || null,
          }),
        });
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (memberId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este miembro del equipo?')) return;

    try {
      await apiFetch(`/users/${memberId}`, {
        method: 'DELETE',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el usuario');
    }
  };

  const filteredStaff = staff.filter((s) => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const searchLower = search.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      s.email.toLowerCase().includes(searchLower) ||
      s.role.name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" /> Gestión de Personal & Equipo
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Administra los roles, accesos y sucursales asignadas para tus cajeros, meseros, cocineros y administradores.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" /> Agregar Personal
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Filter and search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Buscar miembro del equipo por nombre, email o rol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-xs font-medium">Cargando personal del restaurante...</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl shadow-black/30">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-4">Nombre / Email</th>
                <th className="p-4">Rol</th>
                <th className="p-4">Contacto</th>
                <th className="p-4">Sucursal</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/20">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    No se encontraron miembros de equipo registrados.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-extrabold text-slate-100">{member.firstName} {member.lastName}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" /> {member.email}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        member.role.name === 'OWNER' || member.role.name === 'ADMIN'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                          : member.role.name === 'WAITER'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : member.role.name === 'COOK'
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                      }`}>
                        <ShieldCheck className="w-3 h-3" />
                        {member.role.name}
                      </span>
                    </td>
                    <td className="p-4">
                      {member.phone ? (
                        <span className="text-[11px] text-slate-300 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-500" /> {member.phone}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">N/A</span>
                      )}
                    </td>
                    <td className="p-4">
                      {member.branches && member.branches.length > 0 ? (
                        <span className="text-[11px] text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" /> {member.branches[0].name}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Todas / Global</span>
                      )}
                    </td>
                    <td className="p-4">
                      {member.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400">
                          <XCircle className="w-3.5 h-3.5" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(member)}
                          className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="p-1.5 rounded-lg border border-slate-800 hover:border-red-950 bg-slate-900/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                          title="Eliminar"
                          disabled={member.id === user?.id}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-850 flex items-center justify-between bg-slate-950/40">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                {editingId ? 'Editar Miembro de Equipo' : 'Agregar Miembro de Equipo'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-xs text-slate-500 hover:text-slate-300 font-bold"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    placeholder="Ej. Ana"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    placeholder="Ej. Torres"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  placeholder="ejemplo@restaurantos.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  {editingId ? 'Nueva Contraseña (dejar en blanco para conservar)' : 'Contraseña *'}
                </label>
                <input
                  type="password"
                  required={!editingId}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  placeholder={editingId ? '••••••••' : 'Mínimo 6 caracteres'}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Teléfono (Opcional)</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  placeholder="+573001234567"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Rol *</label>
                  <select
                    value={form.roleName}
                    onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="OWNER">OWNER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="WAITER">WAITER</option>
                    <option value="COOK">COOK</option>
                    <option value="INVENTORY_MANAGER">INVENTORY_MANAGER</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Sucursal *</label>
                  <select
                    value={form.branchId}
                    onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:border-slate-700 text-xs text-slate-400 font-bold transition hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition shadow-lg shadow-orange-500/20"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingId ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
