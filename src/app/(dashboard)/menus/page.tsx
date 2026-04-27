"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CustomModal } from "@/components/ui/dialog-custom";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { Plus, ListTree, Users, Edit3, Trash2, CheckCircle2, Save, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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
          <h1 className="text-3xl font-bold tracking-tight text-accent">Gestión de Menús</h1>
          <p className="text-muted mt-1">Navegación y jerarquías del portal.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold shadow-lg flex gap-2">
          <Plus className="h-4 w-4" /> Nuevo Menú
        </Button>
      </div>

      <Card className="bg-card border-border shadow-xl overflow-hidden">
        <CardHeader className="border-b bg-background/50">
          <CardTitle className="text-lg">Menús Registrados</CardTitle>
          <CardDescription>Visualiza y administra las jerarquías de navegación.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-background/30 text-xs uppercase tracking-widest text-muted font-bold">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Nombre del Menú</th>
                  <th className="px-6 py-4 text-center">Detalles</th>
                  <th className="px-6 py-4 text-center">Perfiles</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted italic">Cargando...</td></tr>
                ) : currentMenus.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted italic">No hay resultados.</td></tr>
                ) : currentMenus.map((menu) => (
                  <tr key={menu.menu_cod} className="hover:bg-background/40 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs">{menu.menu_cod}</td>
                    <td className="px-6 py-4"><span className="font-bold text-foreground">{menu.menu_nombre}</span></td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold border border-accent/20">
                        {menu._count.detalles} ÍTEMS
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20">
                        {menu._count.perfiles} ROLES
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/menus/${menu.menu_cod}/detalles`}>
                          <Button variant="outline" size="sm" className="h-8 gap-2 border-border hover:bg-background transition-all"><ListTree className="h-3.5 w-3.5" /> Items</Button>
                        </Link>
                        <Button onClick={() => openEdit(menu)} variant="outline" size="sm" className="h-8 w-8 p-0 border-border"><Edit3 className="h-3.5 w-3.5" /></Button>
                        <Button onClick={() => handleDeleteClick(menu.menu_cod)} variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 border-transparent"><Trash2 className="h-3.5 w-3.5" /></Button>
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
                Mostrando <span className="text-foreground font-bold">{menus.length > 0 ? startIndex + 1 : 0}</span> a <span className="text-foreground font-bold">{Math.min(startIndex + itemsPerPage, menus.length)}</span> de <span className="text-foreground font-bold">{menus.length}</span> menús
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

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMenu ? "Editar Menú" : "Crear Menú"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nombre del Menú</Label>
            <Input 
              value={menuName} 
              onChange={(e) => setMenuName(e.target.value)} 
              required 
              autoFocus={true}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-accent text-white font-bold gap-2"><Save className="h-4 w-4" /> {editingMenu ? "Actualizar" : "Crear"}</Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title="¿Borrar Menú?" description="Esta acción es irreversible." />
    </div>
  );
}
