"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CustomModal } from "@/components/ui/dialog-custom";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { Plus, Truck, Edit3, Trash2, CheckCircle2, Save, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react";

interface TipoPersonalEntrega {
  tip_per_ent_id: number;
  tip_per_ent_dsc: string;
  tip_per_ent_est: boolean;
  tip_per_ent_usuario_alta: string;
  tip_per_ent_fecha_alta: string;
  tip_per_ent_tenantid: number;
}

export default function TipoPersonalEntregaPage() {
  const { isHidden, isReadOnly, loadingRestrictions } = useFieldSecurity("TipoPersonalEntrega");
  const [data, setData] = useState<TipoPersonalEntrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<TipoPersonalEntrega | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    dsc: "",
    est: true
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const tenantId = user?.tenantId || "public";

      const res = await fetch("/api/admin/tipo-personal-entrega", {
        headers: {
          "x-tenant-id": tenantId,
          "x-user-email": user?.email || "",
          "x-user-profile": user?.perfil_cod?.toString() || ""
        }
      });
      const result = await res.json();
      setData(Array.isArray(result) ? result : []);
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
    setEditingItem(null);
    setFormData({ dsc: "", est: true });
    setIsModalOpen(true);
  };

  const openEdit = (item: TipoPersonalEntrega) => {
    setEditingItem(item);
    setFormData({ 
      dsc: item.tip_per_ent_dsc || "", 
      est: item.tip_per_ent_est ?? true 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dsc.trim()) return;

    setIsSubmitting(true);
    try {
      const method = editingItem ? "PUT" : "POST";
      const url = editingItem ? `/api/admin/tipo-personal-entrega/${editingItem.tip_per_ent_id}` : "/api/admin/tipo-personal-entrega";

      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const tenantId = user?.tenantId || "public";
      const usuarioPk = user?.email || "SISTEMA";

      const res = await fetch(url, {
        method,
        body: JSON.stringify({
          ...formData,
          tenantId, 
          usuario: usuarioPk 
        }),
        headers: { 
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-email": user?.email || "",
          "x-user-profile": user?.perfil_cod?.toString() || ""
        }
      });

      if (res.ok) {
        setIsModalOpen(false);
        showToast(editingItem ? "Registro actualizado" : "Registro creado");
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Error al guardar registro");
      }
    } catch (e) {
      console.error(e);
      showToast("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setItemToDelete(id);
    setIsConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!itemToDelete) return;
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const tenantId = user?.tenantId || "public";

    const res = await fetch(`/api/admin/tipo-personal-entrega/${itemToDelete}`, { 
      method: "DELETE",
      headers: {
        "x-tenant-id": tenantId,
        "x-user-email": user?.email || "",
        "x-user-profile": user?.perfil_cod?.toString() || ""
      }
    });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Registro eliminado");
      fetchData();
    } else {
       const err = await res.json();
       showToast(err.error || "No se pudo eliminar");
    }
  };

  // Lógica de Paginación
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = data.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loadingRestrictions && loading) {
    return <div className="h-screen flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Sincronizando Seguridad...</div>;
  }

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
          <h1 className="text-3xl font-bold tracking-tight text-accent">Tipo Personal Entrega</h1>
          <p className="text-muted mt-1">Administra las categorías de personal encargado de entregas.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold shadow-lg flex gap-2">
          <Plus className="h-4 w-4" /> Nuevo Tipo
        </Button>
      </div>

      <Card className="bg-card border-border shadow-xl overflow-hidden">
        <CardHeader className="border-b bg-background/50">
          <CardTitle className="text-lg">Tipos Registrados</CardTitle>
          <CardDescription>Categorías de personal para logística y distribución.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-background/30 text-xs uppercase tracking-widest text-muted font-bold">
                  {!isHidden("tip_per_ent_id") && <th className="px-6 py-4 w-24">ID</th>}
                  {!isHidden("tip_per_ent_dsc") && <th className="px-6 py-4">Descripción</th>}
                  {!isHidden("tip_per_ent_est") && <th className="px-6 py-4 text-center">Estado</th>}
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-muted italic">Cargando tipos de personal...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-muted italic">No hay registros configurados.</td></tr>
                ) : currentItems.map((item) => (
                  <tr key={item.tip_per_ent_id} className="hover:bg-background/40 transition-colors group">
                    {!isHidden("tip_per_ent_id") && <td className="px-6 py-4 font-mono text-xs text-muted">#{item.tip_per_ent_id}</td>}
                    {!isHidden("tip_per_ent_dsc") && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-accent/5 text-accent">
                            <Truck className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-foreground">{item.tip_per_ent_dsc}</span>
                        </div>
                      </td>
                    )}
                    {!isHidden("tip_per_ent_est") && (
                      <td className="px-6 py-4 text-center">
                        <Badge variant={item.tip_per_ent_est ? "outline" : "secondary"} className={item.tip_per_ent_est ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 font-bold" : "font-bold"}>
                          {item.tip_per_ent_est ? "ACTIVO" : "INACTIVO"}
                        </Badge>
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 gap-2 border-border hover:bg-background group-hover:border-accent group-hover:text-accent transition-all px-3">
                          <Edit3 className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button onClick={() => handleDeleteClick(item.tip_per_ent_id)} variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 border-transparent hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button>
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
                Mostrando <span className="text-foreground font-bold">{data.length > 0 ? startIndex + 1 : 0}</span> a <span className="text-foreground font-bold">{Math.min(startIndex + itemsPerPage, data.length)}</span> de <span className="text-foreground font-bold">{data.length}</span> registros
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
        title={editingItem ? "Editar Tipo" : "Crear Tipo"}
        className="max-w-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-white/50 backdrop-blur-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {!isHidden("tip_per_ent_dsc") && (
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input 
                value={formData.dsc} 
                onChange={(e) => setFormData({...formData, dsc: e.target.value})} 
                placeholder="Ej: Chofer, Ayudante, Courier..."
                className="h-12 border-slate-200 focus-visible:ring-accent font-medium rounded-xl text-slate-950 bg-white shadow-sm"
                required 
                autoFocus
                disabled={isReadOnly("tip_per_ent_dsc")}
              />
            </div>
          )}
          {!isHidden("tip_per_ent_est") && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border mt-2">
              <input 
                type="checkbox" 
                id="est" 
                checked={formData.est} 
                disabled={!editingItem || isReadOnly("tip_per_ent_est")}
                onChange={(e) => setFormData({...formData, est: e.target.checked})}
                className={`h-5 w-5 rounded border-gray-300 text-accent focus:ring-accent accent-accent ${(!editingItem || isReadOnly("tip_per_ent_est")) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="est" className={`text-sm font-bold leading-none ${(!editingItem || isReadOnly("tip_per_ent_est")) ? "cursor-not-allowed text-muted" : "cursor-pointer"}`}>
                  Estado Activo
                </Label>
                <p className="text-xs text-muted font-medium">
                  {editingItem 
                    ? "Indica si este tipo de personal está habilitado para ser asignado." 
                    : "Los nuevos registros se crean activos por defecto."}
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-accent text-white font-bold gap-2 h-12 rounded-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:scale-100 shadow-lg shadow-accent/20">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? "Guardando..." : (editingItem ? "Actualizar Registro" : "Guardar Registro")}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title="¿Eliminar Registro?" description="Esta acción no se puede deshacer y el registro se borrará permanentemente." />
    </div>
  );
}
