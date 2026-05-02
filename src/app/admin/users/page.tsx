"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomModal } from "@/components/ui/dialog-custom";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { 
  Plus, 
  User, 
  Mail, 
  Building2, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Save, 
  MapPin,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Usuario {
  usuario_email: string;
  usuario_nombre: string;
  perfil_cod: number;
  usuario_estado: string | null;
  usuario_tenantid: string;
  perfil: { perfil_nombre: string };
}

export default function UsersPage() {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [listas, setListas] = useState<{perfiles: any[], clientes: any[]}>({
    perfiles: [],
    clientes: []
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    email: "",
    nombre: "",
    password: "",
    perfil_cod: "",
    tenantId: "",
    estado: "A"
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resU, resL] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/listas")
      ]);
      const dataU = await resU.json();
      const dataL = await resL.json();
      
      setUsers(Array.isArray(dataU) ? dataU : []);
      setListas({
        perfiles: dataL.perfiles || [],
        clientes: dataL.clientes || []
      });
      setCurrentPage(1);
    } catch (e) {
      console.error("Error fetching users:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setFormData({ 
      email: "", 
      nombre: "", 
      password: "", 
      perfil_cod: "", 
      tenantId: listas.clientes[0]?.cli_saas_tenant || "",
      estado: "A" 
    });
    setIsModalOpen(true);
  };

  const openEdit = (user: Usuario) => {
    setEditingUser(user);
    setFormData({ 
      email: user.usuario_email, 
      nombre: user.usuario_nombre, 
      password: "", 
      perfil_cod: user.perfil_cod?.toString() || "", 
      tenantId: user.usuario_tenantid || "",
      estado: user.usuario_estado || "A"
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const method = editingUser ? "PUT" : "POST";
      const url = editingUser 
        ? `/api/admin/users/${encodeURIComponent(editingUser.usuario_email)}` 
        : "/api/admin/users";

      const res = await fetch(url, {
        method,
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        setIsModalOpen(false);
        showToast(editingUser ? "Usuario actualizado" : "Usuario creado");
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Error al procesar");
      }
    } catch (e) {
      console.error(e);
      showToast("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (email: string) => {
    setUserToDelete(email);
    setIsConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!userToDelete) return;
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userToDelete)}`, { method: "DELETE" });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Usuario eliminado");
      fetchData();
    }
  };

  // Lógica de Paginación
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = users.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Helper para buscar el nombre de la empresa por su ID
  const getTenantName = (tid: string) => {
    const cliente = listas.clientes.find(e => e.cli_saas_tenant === tid);
    return cliente ? cliente.cli_saas_nom : tid;
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 relative min-h-screen">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-8 duration-300">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/50 backdrop-blur-xl bg-opacity-90">
            <div className="bg-emerald-500 p-1 rounded-full text-white"><CheckCircle2 className="h-4 w-4" /></div>
            <span className="font-bold text-sm tracking-tight">{toast}</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-white">Usuarios <span className="text-red-500">Tenant</span></h1>
          <p className="text-slate-400 mt-1 font-medium">Directorio de acceso al sistema y asignación de roles por instancia.</p>
        </div>
        <Button onClick={openCreate} className="bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/20 flex gap-2 rounded-xl transition-all active:scale-95">
          <Plus className="h-4 w-4" /> Nuevo Usuario
        </Button>
      </div>

      <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-800 bg-slate-950/20 p-6">
          <CardTitle className="text-lg font-bold text-white">Cuentas Registradas</CardTitle>
          <CardDescription className="text-slate-500">Visualiza y administra las cuentas de acceso y sus permisos globales.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/30 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                  <th className="px-6 py-4">Usuario / Email</th>
                  <th className="px-6 py-4">Perfil</th>
                  <th className="px-6 py-4">Tenant Asignado</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic font-medium">Cargando directorio...</td></tr>
                ) : currentUsers.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic font-medium">No hay usuarios registrados.</td></tr>
                ) : currentUsers.map((user) => (
                  <tr key={user.usuario_email} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 leading-none mb-1 group-hover:text-white transition-colors">{user.usuario_nombre}</p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold">
                            <Mail className="h-3 w-3" /> {user.usuario_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 group-hover:text-slate-300">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          {user.perfil?.perfil_nombre || "Sin rol"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-slate-950/30 text-slate-400 border-slate-800 font-bold text-[10px] uppercase tracking-tighter">
                        <Building2 className="h-3 w-3 mr-1.5 opacity-50" />
                        {getTenantName(user.usuario_tenantid)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={`font-black uppercase text-[9px] tracking-widest px-2 py-0.5 border-2 ${user.usuario_estado === 'A' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {user.usuario_estado === 'A' ? 'ACTIVO' : 'INACTIVO'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(user)} variant="outline" size="sm" className="h-8 gap-2 border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all px-3 font-bold text-[10px] uppercase tracking-tighter">
                          <Edit3 className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button 
                          onClick={() => handleDeleteClick(user.usuario_email)} 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-slate-600 border-slate-800 bg-slate-950/50 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Paginación Estandarizada */}
          {!loading && users.length > 0 && (
            <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/20">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Mostrando <span className="text-white font-black">{startIndex + 1}</span> a <span className="text-white font-black">{Math.min(startIndex + itemsPerPage, users.length)}</span> de <span className="text-white font-black">{users.length}</span> registros
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400" onClick={() => goToPage(1)} disabled={currentPage === 1} title="Primero"><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} title="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
                
                <div className="flex items-center gap-1 mx-2">
                  <Badge variant="secondary" className="h-8 px-3 flex items-center justify-center p-0 rounded-lg bg-red-500/10 text-red-500 font-black border-red-500/20 text-xs">
                    {currentPage}
                  </Badge>
                  <span className="text-[10px] text-slate-600 font-black uppercase px-1">de</span>
                  <span className="text-[10px] text-slate-600 font-black uppercase px-1">{totalPages || 1}</span>
                </div>
 
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} title="Siguiente"><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} title="Último"><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"} variant="dark">
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label className="text-white font-bold text-xs uppercase tracking-widest">Nombre Completo</Label>
              <Input 
                className="h-12 bg-slate-950 border-slate-800 text-white focus:ring-red-500/50 rounded-xl font-medium"
                value={formData.nombre} 
                onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                required 
                autoFocus
                placeholder="Nombre del funcionario"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white font-bold text-xs uppercase tracking-widest">Correo Electrónico (Login)</Label>
              <Input 
                type="email"
                className="h-12 bg-slate-950 border-slate-800 text-white focus:ring-red-500/50 rounded-xl font-medium"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                disabled={!!editingUser}
                required
                placeholder="email@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white font-bold text-xs uppercase tracking-widest">{editingUser ? "Nueva Password (opcional)" : "Password"}</Label>
              <div className="relative">
                <Input 
                  type="text"
                  className="h-12 bg-slate-950 border-slate-800 text-white focus:ring-red-500/50 rounded-xl font-medium"
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  required={!editingUser}
                  placeholder={editingUser ? "Dejar vacío para no cambiar" : "****"}
                />
                <KeyRound className="absolute right-3 top-2.5 h-4 w-4 text-slate-600 opacity-50" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white font-bold text-xs uppercase tracking-widest">Perfil de Acceso</Label>
              <select 
                className="flex h-12 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white font-medium focus:ring-2 focus:ring-red-500/50 focus:outline-none transition-all"
                value={formData.perfil_cod}
                onChange={e => setFormData({...formData, perfil_cod: e.target.value})}
                required
              >
                <option value="" className="bg-slate-900">Seleccionar perfil...</option>
                {listas.perfiles.map(p => <option key={p.perfil_cod} value={p.perfil_cod} className="bg-slate-900">{p.perfil_nombre}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-white font-bold text-xs uppercase tracking-widest">Estado</Label>
              <select 
                className="flex h-12 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white font-medium focus:ring-2 focus:ring-red-500/50 focus:outline-none transition-all"
                value={formData.estado}
                onChange={e => setFormData({...formData, estado: e.target.value})}
              >
                <option value="A" className="bg-slate-900">Activo</option>
                <option value="I" className="bg-slate-900">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label className="text-white font-bold text-xs uppercase tracking-widest">Asignar a Tenant (Cliente)</Label>
              <select 
                className="flex h-12 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white font-medium focus:ring-2 focus:ring-red-500/50 focus:outline-none transition-all"
                value={formData.tenantId}
                onChange={e => setFormData({...formData, tenantId: e.target.value})}
                required
              >
                <option value="" className="bg-slate-900">Seleccionar cliente...</option>
                {listas.clientes.map(cli => (
                  <option key={cli.cli_saas_cod} value={cli.cli_saas_tenant} className="bg-slate-900">
                    {cli.cli_saas_nom} ({cli.cli_saas_tenant})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold gap-2 rounded-xl transition-all active:scale-95 py-6 uppercase tracking-widest text-xs disabled:opacity-70 disabled:scale-100">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? "Guardando..." : (editingUser ? "Actualizar" : "Crear Usuario")}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1 border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl h-12 uppercase tracking-widest text-xs transition-all active:scale-95"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title="¿Eliminar Cuenta?" description="Esta acción revocará el acceso permanente de este usuario al sistema." variant="dark" />
    </div>
  );
}
