"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomModal } from "@/components/ui/dialog-custom";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { 
  Plus, Search, Edit3, Trash2, CheckCircle2, Save, 
  Shield, Layout, UserCircle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

export default function PerfilesPage() {
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Perfil | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Perfil | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    menu_cod: ""
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resP, resM] = await Promise.all([
        fetch("/api/admin/perfiles"),
        fetch("/api/admin/menus")
      ]);
      const dataP = await resP.json();
      const dataM = await resM.json();
      
      setPerfiles(Array.isArray(dataP) ? dataP : []);
      setMenus(Array.isArray(dataM) ? dataM : []);
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ nombre: "", menu_cod: "" });
    setIsModalOpen(true);
  };

  const openEdit = (item: Perfil) => {
    setEditingItem(item);
    setFormData({
      nombre: item.perfil_nombre,
      menu_cod: item.menu_cod.toString()
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/admin/perfiles/${editingItem.perfil_cod}` : "/api/admin/perfiles";

    const res = await fetch(url, {
      method,
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      setIsModalOpen(false);
      showToast(editingItem ? "Perfil actualizado" : "Perfil creado");
      fetchData();
    } else {
      const err = await res.json();
      showToast(err.error || "Error al procesar");
    }
  };

  const handleDeleteClick = (item: Perfil) => {
    setItemToDelete(item);
    setIsConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!itemToDelete) return;
    const res = await fetch(`/api/admin/perfiles/${itemToDelete.perfil_cod}`, { method: "DELETE" });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Perfil eliminado");
      fetchData();
    } else {
      const err = await res.json();
      showToast(err.error || "No se pudo eliminar");
    }
  };

  const filteredData = perfiles.filter(item => 
    item.perfil_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

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
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="font-bold text-sm">{toast}</span>
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
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
           <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-slate-700">Listado de Roles</CardTitle>
                <CardDescription className="text-xs">Configuración de acceso por perfil.</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                <Input 
                  placeholder="Buscar perfil..." 
                  className="h-10 border-slate-200 bg-white w-64 pl-9 text-sm rounded-xl focus:ring-accent" 
                  value={searchTerm} 
                  onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} 
                />
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] tracking-tight text-slate-400 font-bold uppercase">
                  <th className="px-8 py-4 w-24 text-center">ID</th>
                  <th className="px-8 py-4">Nombre del Perfil</th>
                  <th className="px-8 py-4">Menú Asignado</th>
                  <th className="px-8 py-4 text-center">Usuarios</th>
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-400 italic">Cargando perfiles...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-400 italic">No se encontraron perfiles.</td></tr>
                ) : currentItems.map((item) => (
                  <tr key={item.perfil_cod} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-4 font-mono text-[11px] text-accent font-black text-center">#{item.perfil_cod}</td>
                    <td className="px-8 py-4">
                       <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-accent/10">
                            <Shield className="h-4 w-4 text-accent" />
                         </div>
                         <span className="font-bold text-slate-700">{item.perfil_nombre}</span>
                       </div>
                    </td>
                    <td className="px-8 py-4">
                       <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                         <Layout className="h-3.5 w-3.5 text-slate-400" />
                         {item.menu?.menu_nombre}
                       </div>
                    </td>
                    <td className="px-8 py-4 text-center">
                       <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
                         <UserCircle className="h-4 w-4" />
                         {item._count?.usuarios}
                       </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 gap-2 border-slate-200 hover:bg-slate-50 px-3 font-bold text-xs text-slate-600">
                           <Edit3 className="h-3.5 w-3.5" /> Editar
                         </Button>
                         <Button onClick={() => handleDeleteClick(item)} variant="outline" size="icon" className="h-8 w-8 text-red-500 border-transparent hover:bg-red-50">
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
          {!loading && filteredData.length > 0 && (
            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/20">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                Mostrando <span className="text-slate-600 font-black">{startIndex + 1}</span> a <span className="text-slate-600 font-black">{Math.min(startIndex + itemsPerPage, filteredData.length)}</span> de <span className="text-slate-600 font-black">{filteredData.length}</span> registros
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => goToPage(1)} disabled={currentPage === 1} title="Primero"><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} title="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
                
                <div className="flex items-center gap-1 mx-2">
                  <Badge variant="secondary" className="h-8 w-8 flex items-center justify-center p-0 rounded-lg bg-accent/10 text-accent font-bold border-accent/20">
                    {currentPage}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-black uppercase px-1">de</span>
                  <span className="text-[10px] text-slate-400 font-black uppercase px-1">{totalPages || 1}</span>
                </div>

                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} title="Siguiente"><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} title="Último"><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal CRUD */}
      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Editar Perfil" : "Nuevo Perfil"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nombre del Perfil</Label>
            <Input 
              value={formData.nombre} 
              onChange={e => setFormData({...formData, nombre: e.target.value})} 
              placeholder="Ej: Administrador, Cajero..." 
              required 
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Menú Asignado</Label>
            <select 
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none"
              value={formData.menu_cod}
              onChange={e => setFormData({...formData, menu_cod: e.target.value})}
              required
            >
              <option value="">Seleccione un menú...</option>
              {menus.map(m => (
                <option key={m.menu_cod} value={m.menu_cod}>{m.menu_nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-6">
            <Button type="submit" className="flex-1 bg-accent text-white font-bold h-12 rounded-2xl shadow-lg flex gap-2 uppercase tracking-tighter transition-all hover:scale-[1.02] active:scale-95">
              <Save className="h-4 w-4" /> Guardar Perfil
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-tighter text-slate-500">
              Cancelar
            </Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={onConfirmDelete} 
        title="¿Eliminar Perfil?" 
        description="Esta acción no se puede deshacer y podría afectar a los usuarios vinculados." 
      />
    </div>
  );
}
