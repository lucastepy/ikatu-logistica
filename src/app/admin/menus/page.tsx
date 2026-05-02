"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CustomModal } from "@/components/ui/dialog-custom";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { Plus, ListTree, Users, Edit3, Trash2, CheckCircle2, Save, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface Menu {
  menu_cod: number;
  menu_nombre: string;
  _count: {
    detalles: number;
    perfiles: number;
  };
}

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<number | null>(null);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [menuName, setMenuName] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMenus = () => {
    setLoading(true);
    fetch("/api/admin/menus")
      .then(res => res.json())
      .then(data => {
        setMenus(Array.isArray(data) ? data : []);
        setLoading(false);
        setCurrentPage(1);
      })
      .catch(err => {
        console.error("Error fetching menus:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const openCreate = () => {
    setEditingMenu(null);
    setMenuName("");
    setIsModalOpen(true);
  };

  const openEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setMenuName(menu.menu_nombre);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuName.trim()) return;
    setIsSubmitting(true);
    try {
      const method = editingMenu ? "PUT" : "POST";
      const url = editingMenu ? `/api/admin/menus/${editingMenu.menu_cod}` : "/api/admin/menus";

      const res = await fetch(url, {
        method,
        body: JSON.stringify({ nombre: menuName }),
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        setIsModalOpen(false);
        showToast(editingMenu ? "Menú actualizado" : "Menú creado");
        fetchMenus();
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

  const handleDeleteClick = (id: number) => {
    setMenuToDelete(id);
    setIsConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!menuToDelete) return;
    const res = await fetch(`/api/admin/menus/${menuToDelete}`, { method: "DELETE" });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Menú eliminado");
      fetchMenus();
    }
  };

  // Lógica de Paginación
  const totalPages = Math.ceil(menus.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMenus = menus.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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
          <h1 className="text-3xl font-extrabold tracking-tighter text-white">Gestión de <span className="text-red-500">Menús</span></h1>
          <p className="text-slate-400 mt-1 font-medium">Navegación y jerarquías globales del portal administrativo.</p>
        </div>
        <Button onClick={openCreate} className="bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/20 flex gap-2 rounded-xl transition-all active:scale-95">
          <Plus className="h-4 w-4" /> Nuevo Menú
        </Button>
      </div>

      <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-800 bg-slate-950/20 p-6">
          <CardTitle className="text-lg font-bold text-white">Menús Registrados</CardTitle>
          <CardDescription className="text-slate-500">Visualiza y administra las jerarquías de navegación.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/30 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                  <th className="px-6 py-4 w-20">ID</th>
                  <th className="px-6 py-4">Nombre del Menú</th>
                  <th className="px-6 py-4 text-center">Detalles</th>
                  <th className="px-6 py-4 text-center">Perfiles</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic font-medium">Cargando...</td></tr>
                ) : currentMenus.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic font-medium">No hay resultados.</td></tr>
                ) : currentMenus.map((menu) => (
                  <tr key={menu.menu_cod} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-600 font-bold">#{menu.menu_cod}</td>
                    <td className="px-6 py-4"><span className="font-bold text-slate-200 group-hover:text-white transition-colors">{menu.menu_nombre}</span></td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-black border border-red-500/20 uppercase tracking-tighter">
                        {menu._count.detalles} ÍTEMS
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-black border border-blue-500/20 uppercase tracking-tighter">
                        {menu._count.perfiles} ROLES
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/menus/${menu.menu_cod}/detalles`}>
                          <Button variant="outline" size="sm" className="h-8 gap-2 border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all px-3 font-bold text-[10px] uppercase tracking-tighter">
                            <ListTree className="h-3.5 w-3.5" /> Items
                          </Button>
                        </Link>
                        <Button onClick={() => openEdit(menu)} variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          onClick={() => handleDeleteClick(menu.menu_cod)} 
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
          {!loading && menus.length > 0 && (
            <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/20">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Mostrando <span className="text-white font-black">{startIndex + 1}</span> a <span className="text-white font-black">{Math.min(startIndex + itemsPerPage, menus.length)}</span> de <span className="text-white font-black">{menus.length}</span> registros
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

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMenu ? "Editar Menú" : "Crear Menú"} variant="dark">
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-white font-bold">Nombre del Menú</Label>
            <Input 
              className="h-12 bg-slate-950 border-slate-800 text-white focus:ring-red-500/50 font-medium rounded-xl"
              value={menuName} 
              onChange={(e) => setMenuName(e.target.value)} 
              required 
              autoFocus={true}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold gap-2 rounded-xl transition-all active:scale-95 disabled:opacity-70 disabled:scale-100">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? "Guardando..." : (editingMenu ? "Actualizar" : "Crear")}
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

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title="¿Borrar Menú?" description="Esta acción es irreversible." variant="dark" />
    </div>
  );
}
