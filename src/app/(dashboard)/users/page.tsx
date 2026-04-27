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
  ChevronsRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Usuario {
  usuario_email: string;
  usuario_nombre: string;
  usuario_empresa: number;
  usuario_sucursal: number | null;
  perfil_cod: number;
  usuario_estado: string | null;
  usuario_tenantid: number;
  empresa: { empresa_nom: string | null };
  sucursal: { suc_nombre: string | null } | null;
  perfil: { perfil_nombre: string };
}

export default function UsersPage() {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [listas, setListas] = useState<{empresas: any[], sucursales: any[], perfiles: any[]}>({
    empresas: [],
    sucursales: [],
    perfiles: []
  });
  const [loading, setLoading] = useState(true);
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
    empresa_cod: "",
    sucursal_id: "",
    tenantId: "1",
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
      setListas(dataL);
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
      empresa_cod: "", 
      sucursal_id: "", 
      tenantId: "1", 
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
      perfil_cod: user.perfil_cod.toString(), 
      empresa_cod: user.usuario_empresa.toString(), 
      sucursal_id: user.usuario_sucursal?.toString() || "", 
      tenantId: user.usuario_tenantid.toString(), 
      estado: user.usuario_estado || "A" 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 relative">
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
          <h1 className="text-3xl font-bold tracking-tight text-accent">Gestión de Usuarios</h1>
          <p className="text-muted mt-1">Directorio de acceso al sistema y asignación de roles.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold shadow-lg flex gap-2">
          <Plus className="h-4 w-4" /> Nuevo Usuario
        </Button>
      </div>

      <Card className="bg-card border-border shadow-xl overflow-hidden">
        <CardHeader className="border-b bg-background/50">
          <CardTitle className="text-lg">Usuarios del Sistema</CardTitle>
          <CardDescription>Visualiza y administra las cuentas de acceso y sus permisos.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-background/30 text-xs uppercase tracking-widest text-muted font-bold">
                  <th className="px-6 py-4">Usuario / Email</th>
                  <th className="px-6 py-4">Empresa / Sucursal</th>
                  <th className="px-6 py-4">Perfil / Rol</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted italic">Cargando directorio...</td></tr>
                ) : currentUsers.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted italic">No hay usuarios registrados.</td></tr>
                ) : currentUsers.map((user) => (
                  <tr key={user.usuario_email} className="hover:bg-background/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/5 text-accent border border-accent/10">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground leading-none mb-1">{user.usuario_nombre}</p>
                          <div className="flex items-center gap-1 text-[11px] text-muted font-medium">
                            <Mail className="h-3 w-3" /> {user.usuario_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {user.empresa?.empresa_nom}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 pl-5">
                          <MapPin className="h-3 w-3" />
                          {user.sucursal?.suc_nombre || "Oficina Central"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1 rounded-md bg-blue-500/5 text-blue-600 border border-blue-500/10 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="h-3 w-3" /> {user.perfil?.perfil_nombre}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={`font-black uppercase text-[9px] tracking-tighter ${user.usuario_estado === 'A' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                        {user.usuario_estado === 'A' ? 'ACTIVO' : 'INACTIVO'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(user)} variant="outline" size="sm" className="h-8 gap-2 border-border hover:bg-background group-hover:border-accent group-hover:text-accent transition-all px-3 font-bold text-xs uppercase tracking-tighter">
                          <Edit3 className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button onClick={() => handleDeleteClick(user.usuario_email)} variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 border-transparent hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Paginación */}
          {!loading && (
            <div className="flex items-center justify-between px-6 py-4 bg-background/50 border-t border-border">
              <p className="text-xs text-muted font-medium">
                Mostrando <span className="text-foreground font-bold">{users.length > 0 ? startIndex + 1 : 0}</span> a <span className="text-foreground font-bold">{Math.min(startIndex + itemsPerPage, users.length)}</span> de <span className="text-foreground font-bold">{users.length}</span> usuarios
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(1)} disabled={currentPage === 1 || totalPages <= 1} title="Primero"><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || totalPages <= 1} title="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
                
                <div className="flex items-center gap-1 mx-2">
                  <Badge variant="secondary" className="h-8 w-8 flex items-center justify-center p-0 rounded-lg bg-accent/10 text-accent font-bold border-accent/20">
                    {currentPage}
                  </Badge>
                  <span className="text-xs text-muted font-bold px-1">de</span>
                  <span className="text-xs text-muted font-bold px-1">{totalPages || 1}</span>
                </div>

                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || totalPages <= 1} title="Siguiente"><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages || totalPages <= 1} title="Último"><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Nombre Completo</Label>
              <Input 
                value={formData.nombre} 
                onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                required 
                autoFocus
                placeholder="Nombre del funcionario"
              />
            </div>
            <div className="space-y-2">
              <Label>Correo Electrónico (Login)</Label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                disabled={!!editingUser}
                required
                placeholder="email@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{editingUser ? "Nueva Password (opcional)" : "Password"}</Label>
              <div className="relative">
                <Input 
                  type="text"
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  required={!editingUser}
                  placeholder={editingUser ? "Dejar vacío para no cambiar" : "****"}
                />
                <KeyRound className="absolute right-3 top-2.5 h-4 w-4 text-muted opacity-30" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Perfil de Acceso</Label>
              <select 
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.perfil_cod}
                onChange={e => setFormData({...formData, perfil_cod: e.target.value})}
                required
              >
                <option value="">Seleccionar perfil...</option>
                {listas.perfiles.map(p => <option key={p.perfil_cod} value={p.perfil_cod}>{p.perfil_nombre}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <select 
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.estado}
                onChange={e => setFormData({...formData, estado: e.target.value})}
              >
                <option value="A">Activo</option>
                <option value="I">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <select 
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.empresa_cod}
                onChange={e => setFormData({...formData, empresa_cod: e.target.value})}
                required
              >
                <option value="">Seleccionar empresa...</option>
                {listas.empresas.map(e => <option key={e.empresa_cod} value={e.empresa_cod}>{e.empresa_nom}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Sucursal (Opcional)</Label>
              <select 
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.sucursal_id}
                onChange={e => setFormData({...formData, sucursal_id: e.target.value})}
              >
                <option value="">Sin sucursal (Administración)</option>
                {listas.sucursales.map(s => <option key={s.suc_id} value={s.suc_id}>{s.suc_nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="submit" className="flex-1 bg-accent text-white font-bold gap-2 uppercase tracking-tight"><Save className="h-4 w-4" /> {editingUser ? "Actualizar" : "Crear Usuario"}</Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 font-bold uppercase tracking-tight">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title="¿Eliminar Cuenta?" description="Esta acción revocará el acceso permanente de este usuario al sistema." />
    </div>
  );
}
