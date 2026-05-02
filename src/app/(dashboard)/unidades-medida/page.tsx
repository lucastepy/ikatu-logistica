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
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Save, 
  Ruler,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFieldSecurity } from "@/hooks/useFieldSecurity";

interface UnidadMedida {
  uni_med_cod: number;
  uni_med_dsc: string;
}

export default function UnidadesMedidaPage() {
  const { isHidden, isReadOnly, loadingRestrictions } = useFieldSecurity("UnidadMedida");
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<UnidadMedida | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [formData, setFormData] = useState({
    cod: "",
    dsc: ""
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

      const res = await fetch("/api/admin/unidades-medida", {
        headers: {
          "x-tenant-id": tenantId,
          "x-user-email": user?.email || "",
          "x-user-profile": user?.perfil_cod?.toString() || ""
        }
      });
      const data = await res.json();
      setUnidades(Array.isArray(data) ? data : []);
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
    setFormData({ cod: "", dsc: "" });
    setIsModalOpen(true);
  };

  const openEdit = (item: UnidadMedida) => {
    setEditingItem(item);
    setFormData({ 
      cod: item.uni_med_cod.toString(), 
      dsc: item.uni_med_dsc || ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const method = editingItem ? "PUT" : "POST";
      const url = editingItem ? `/api/admin/unidades-medida/${editingItem.uni_med_cod}` : "/api/admin/unidades-medida";

      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const tenantId = user?.tenantId || "public";

      const res = await fetch(url, {
        method,
        body: JSON.stringify(formData),
        headers: { 
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-email": user?.email || "",
          "x-user-profile": user?.perfil_cod?.toString() || ""
        }
      });

      if (res.ok) {
        setIsModalOpen(false);
        showToast(editingItem ? "Unidad actualizada" : "Unidad creada");
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

  const handleDeleteClick = (id: number) => {
    setItemToDelete(id);
    setIsConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!itemToDelete) return;
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const tenantId = user?.tenantId || "public";

    const res = await fetch(`/api/admin/unidades-medida/${itemToDelete}`, { 
      method: "DELETE",
      headers: {
        "x-tenant-id": tenantId,
        "x-user-email": user?.email || "",
        "x-user-profile": user?.perfil_cod?.toString() || ""
      }
    });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Unidad eliminada");
      fetchData();
    } else {
      const err = await res.json();
      showToast(err.error || "Error al eliminar");
    }
  };

  // Filtrado
  const filteredUnidades = unidades.filter(u => 
    (u.uni_med_dsc || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.uni_med_cod || "").toString().includes(searchTerm)
  );

  // Lógica de Paginación
  const totalPages = Math.ceil(filteredUnidades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUnidades = filteredUnidades.slice(startIndex, startIndex + itemsPerPage);

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
          <h1 className="text-3xl font-bold tracking-tight text-accent">Unidades de Medida</h1>
          <p className="text-muted mt-1">Gestión de unidades para dimensionamiento y cubicaje.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold shadow-lg flex gap-2">
          <Plus className="h-4 w-4" /> Nueva Unidad
        </Button>
      </div>

      <Card className="bg-card border-border shadow-xl overflow-hidden">
        <CardHeader className="border-b bg-background/50 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Catálogo de Medidas</CardTitle>
              <CardDescription>Estándares utilizados en el transporte y almacenamiento.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted opacity-50" />
              <Input 
                placeholder="Buscar por nombre o código..." 
                className="pl-10 h-9"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-background/30 text-xs uppercase tracking-widest text-muted font-bold">
                  {!isHidden("uni_med_cod") && <th className="px-6 py-4 w-24 text-center">Código</th>}
                  {!isHidden("uni_med_dsc") && <th className="px-6 py-4">Descripción / Unidad</th>}
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-muted italic">Cargando catálogo...</td></tr>
                ) : currentUnidades.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-muted italic">No hay unidades registradas.</td></tr>
                ) : currentUnidades.map((item) => (
                  <tr key={item.uni_med_cod} className="hover:bg-background/40 transition-colors group">
                    {!isHidden("uni_med_cod") && (
                      <td className="px-6 py-4 text-center">
                        <Badge variant="secondary" className="font-mono text-[10px] bg-slate-100 text-slate-500 border-slate-200">
                          #{item.uni_med_cod}
                        </Badge>
                      </td>
                    )}
                    {!isHidden("uni_med_dsc") && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-accent/5 text-accent border border-accent/10">
                            <Ruler className="h-4 w-4" />
                          </div>
                          <p className="font-bold text-foreground text-sm tracking-tight">{item.uni_med_dsc}</p>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 gap-2 border-slate-200 hover:bg-slate-50 transition-all px-3 font-bold text-xs shadow-sm text-slate-600">
                          <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" /> Editar
                        </Button>
                        <Button onClick={() => handleDeleteClick(item.uni_med_cod)} variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 border-transparent hover:bg-red-50 transition-all">
                          <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                        </Button>
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
                Mostrando <span className="text-foreground font-bold">{filteredUnidades.length > 0 ? startIndex + 1 : 0}</span> a <span className="text-foreground font-bold">{Math.min(startIndex + itemsPerPage, filteredUnidades.length)}</span> de <span className="text-foreground font-bold">{filteredUnidades.length}</span> unidades
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(1)} disabled={currentPage === 1 || totalPages <= 1} title="Primero"><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || totalPages <= 1} title="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
                
                <div className="flex items-center gap-1 mx-2">
                  <Badge variant="secondary" className="h-8 w-8 flex items-center justify-center p-0 rounded-lg bg-accent/10 text-accent font-bold border-accent/20 shadow-sm">
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
        title={editingItem ? "Editar Unidad" : "Nueva Unidad de Medida"}
        className="max-w-xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-white/50 backdrop-blur-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {!isHidden("uni_med_dsc") && (
            <div className="space-y-2">
              <Label className="text-slate-700 font-bold">Descripción / Nombre</Label>
              <div className="relative">
                <Input 
                  value={formData.dsc} 
                  onChange={(e) => setFormData({...formData, dsc: e.target.value})} 
                  placeholder="Ej: Kilogramos, Metros Cúbicos..."
                  className="h-12 pl-9 text-slate-950 font-medium bg-white border-slate-200 shadow-sm"
                  required 
                  autoFocus
                  disabled={isReadOnly("uni_med_dsc")}
                />
                <Package className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 opacity-60" />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-accent text-white font-bold gap-2 shadow-lg h-12 rounded-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:scale-100">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? "Guardando..." : (editingItem ? "Actualizar" : "Guardar Unidad")}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title="¿Eliminar Unidad?" description="Esta acción es permanente. Solo se podrá eliminar si no existen productos o servicios vinculados." />
    </div>
  );
}
