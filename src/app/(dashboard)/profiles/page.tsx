"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CustomModal } from "@/components/ui/dialog-custom";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { Plus, Shield, Users, Edit3, Trash2, CheckCircle2, Save, Layout, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react";

interface Menu {
  menu_cod: number;
  menu_nombre: string;
}

interface Perfil {
  perfil_cod: number;
  perfil_nombre: string;
  menu_cod: number;
  menu: {
    menu_nombre: string;
  };
  _count: {
    usuarios: number;
  };
}

export default function ProfilesPage() {
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [perfilToDelete, setPerfilToDelete] = useState<number | null>(null);
  const [editingPerfil, setEditingPerfil] = useState<Perfil | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    nombre: "",
    menu_cod: ""
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const resP = await fetch("/api/admin/profiles");
      const dataP = await resP.json();
      setPerfiles(Array.isArray(dataP) ? dataP : []);

      const resM = await fetch("/api/admin/menus");
      const dataM = await resM.json();
      setMenus(Array.isArray(dataM) ? dataM : []);
      setCurrentPage(1);
    } catch (e) {
      console.error("Error fetching data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingPerfil(null);
    setFormData({ nombre: "", menu_cod: "" });
    setIsModalOpen(true);
  };

  const openEdit = (perfil: Perfil) => {
    setEditingPerfil(perfil);
    setFormData({ 
      nombre: perfil.perfil_nombre, 
      menu_cod: perfil.menu_cod.toString() 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.menu_cod) return;

    setIsSubmitting(true);
    try {
      const method = editingPerfil ? "PUT" : "POST";
      const url = editingPerfil ? `/api/admin/profiles/${editingPerfil.perfil_cod}` : "/api/admin/profiles";

      const res = await fetch(url, {
        method,
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        setIsModalOpen(false);
        showToast(editingPerfil ? "Perfil actualizado" : "Perfil creado");
        fetchData();
      } else {
        showToast("Error al procesar solicitud");
      }
    } catch (e) {
      console.error(e);
      showToast("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setPerfilToDelete(id);
    setIsConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!perfilToDelete) return;
    const res = await fetch(`/api/admin/profiles/${perfilToDelete}`, { method: "DELETE" });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Perfil eliminado");
      fetchData();
    }
  };

  // Lógica de Paginación
  const totalPages = Math.ceil(perfiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProfiles = perfiles.slice(startIndex, startIndex + itemsPerPage);

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
          <h1 className="text-3xl font-bold tracking-tight text-accent">Perfiles de Usuario</h1>
          <p className="text-muted mt-1">Administra los roles y sus permisos de navegación.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold shadow-lg flex gap-2">
          <Plus className="h-4 w-4" /> Nuevo Perfil
        </Button>
      </div>

      <Card className="bg-card border-border shadow-xl overflow-hidden">
        <CardHeader className="border-b bg-background/50">
          <CardTitle className="text-lg">Perfiles Registrados</CardTitle>
          <CardDescription>Roles configurados en el sistema y sus menús asociados.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-background/30 text-xs uppercase tracking-widest text-muted font-bold">
                  <th className="px-6 py-4 w-24">ID</th>
                  <th className="px-6 py-4">Nombre del Perfil</th>
                  <th className="px-6 py-4">Menú Asignado</th>
                  <th className="px-6 py-4 text-center">Usuarios</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted italic">Cargando perfiles...</td></tr>
                ) : currentProfiles.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted italic">No hay perfiles registrados.</td></tr>
                ) : currentProfiles.map((perfil) => (
                  <tr key={perfil.perfil_cod} className="hover:bg-background/40 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-muted">#{perfil.perfil_cod}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/5 text-accent">
                          <Shield className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-foreground">{perfil.perfil_nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                        <Layout className="h-4 w-4 opacity-50" />
                        {perfil.menu?.menu_nombre || "Sin menú"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-black tracking-widest border border-blue-500/20">
                        <Users className="h-3 w-3" /> {perfil._count.usuarios} USUARIOS
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(perfil)} variant="outline" size="sm" className="h-8 gap-2 border-border hover:bg-background group-hover:border-accent group-hover:text-accent transition-all px-3">
                          <Edit3 className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button onClick={() => handleDeleteClick(perfil.perfil_cod)} variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 border-transparent hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button>
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
                Mostrando <span className="text-foreground font-bold">{perfiles.length > 0 ? startIndex + 1 : 0}</span> a <span className="text-foreground font-bold">{Math.min(startIndex + itemsPerPage, perfiles.length)}</span> de <span className="text-foreground font-bold">{perfiles.length}</span> perfiles
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

      <CustomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingPerfil ? "Editar Perfil" : "Crear Perfil"}
        className="max-w-xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-white/50 backdrop-blur-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nombre del Perfil</Label>
            <Input 
              value={formData.nombre} 
              onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
              placeholder="Ej: Administrador, Vendedor..."
              className="h-12 border-slate-200 text-slate-950 font-medium bg-white shadow-sm"
              required 
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Menú Asignado</Label>
            <select 
              className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 font-medium focus:ring-2 focus:ring-accent outline-none shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.menu_cod}
              onChange={e => setFormData({...formData, menu_cod: e.target.value})}
              required
            >
              <option value="">Seleccionar un esquema de menú...</option>
              {menus.map(menu => (
                <option key={menu.menu_cod} value={menu.menu_cod}>
                  {menu.menu_nombre}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted font-medium italic mt-1">Este menú definirá la navegación para los usuarios con este rol.</p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-accent text-white font-bold gap-2 h-12 rounded-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:scale-100 shadow-lg shadow-accent/20">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? "Guardando..." : (editingPerfil ? "Actualizar" : "Guardar Perfil")}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title="¿Eliminar Perfil?" description="Esta acción no se puede deshacer y podría afectar el acceso de los usuarios vinculados." />
    </div>
  );
}
