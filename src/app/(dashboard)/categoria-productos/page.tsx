"use client";

import { useFieldSecurity } from "@/hooks/useFieldSecurity";

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
  Layers,
  Hash,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Type,
  Binary
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CategoriaProductosPage() {
  const { isHidden, isReadOnly, loadingRestrictions } = useFieldSecurity("CategoriaProducto");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    nombre: "",
    prefijo: "",
    numerador: "0"
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

      const res = await fetch("/api/categoria-productos", {
        headers: {
          "x-tenant-id": tenantId,
          "x-user-email": user?.email || "",
          "x-user-profile": user?.perfil_cod?.toString() || ""
        }
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ nombre: "", prefijo: "", numerador: "0" });
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ 
      nombre: item.cat_prd_nombre, 
      prefijo: item.cat_prd_prefijo || "", 
      numerador: (item.cat_prd_numerador || 0).toString() 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const method = editingItem ? "PUT" : "POST";
      const url = editingItem ? `/api/categoria-productos/${editingItem.cat_prd_id}` : "/api/categoria-productos";

      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const tenantId = user?.tenantId || "public";
      const usuarioPk = user?.id?.toString() || "SISTEMA";

      const res = await fetch(url, {
        method,
        body: JSON.stringify({ ...formData, usuario: usuarioPk }),
        headers: { 
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-email": user?.email || "",
          "x-user-profile": user?.perfil_cod?.toString() || ""
        }
      });

      if (res.ok) {
        setIsModalOpen(false);
        showToast(editingItem ? "Categoría actualizada" : "Categoría creada");
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

  const handleDeleteClick = (item: any) => {
    setItemToDelete(item);
    setIsConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!itemToDelete) return;
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const tenantId = user?.tenantId || "public";

    const res = await fetch(`/api/categoria-productos/${itemToDelete.cat_prd_id}`, { 
      method: "DELETE",
      headers: {
        "x-tenant-id": tenantId,
        "x-user-email": user?.email || "",
        "x-user-profile": user?.perfil_cod?.toString() || ""
      }
    });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Categoría eliminada");
      fetchData();
    } else {
       const err = await res.json();
       showToast(err.error || "No se pudo eliminar");
    }
  };

  const filteredData = data.filter(item => 
    item.cat_prd_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.cat_prd_prefijo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.cat_prd_id.toString().includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loadingRestrictions && loading) {
    return <div className="h-screen flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Sincronizando Seguridad...</div>;
  }

  return (
    <div className="p-8 space-y-6 relative animate-in fade-in duration-500">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-8 duration-300">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/50 backdrop-blur-xl">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="font-bold text-sm tracking-tight">{toast}</span>
          </div>
        </div>
      )}

      {/* Header Premium */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Categorías de Productos</h1>
          <p className="text-muted mt-1 font-medium italic">Clasificación y numeración de activos del catálogo.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold hover:brightness-105 h-11 px-6 rounded-xl shadow-lg shadow-accent/20 transition-all">
          <Plus className="h-4 w-4 mr-2 stroke-[3]" /> Nueva Categoría
        </Button>
      </div>

      <Card className="bg-card border-none shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
           <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-slate-700">Listado de Categorías</CardTitle>
                <CardDescription className="text-xs">Parámetros para la organización de productos.</CardDescription>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                <Input 
                  placeholder="Buscar por ID, nombre o prefijo..." 
                  className="h-9 border-slate-200 bg-white w-80 pl-9 text-sm rounded-xl focus:ring-accent" 
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
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] tracking-tight text-slate-400 font-bold uppercase">
                  {!isHidden("cat_prd_id") && <th className="px-8 py-4 w-32 text-center">ID</th>}
                  {!isHidden("cat_prd_nombre") && <th className="px-8 py-4">Nombre de Categoría</th>}
                  {!isHidden("cat_prd_prefijo") && <th className="px-8 py-4 text-center w-32">Prefijo</th>}
                  {!isHidden("cat_prd_numerador") && <th className="px-8 py-4 text-center w-32">Numerador</th>}
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-400 italic">Cargando categorías...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-400 italic">No se encontraron categorías.</td></tr>
                ) : currentItems.map((item) => (
                  <tr key={item.cat_prd_id} className="hover:bg-slate-50/30 transition-colors group">
                    {!isHidden("cat_prd_id") && (
                      <td className="px-8 py-4 font-mono text-[11px] text-accent font-black text-center">
                         <span className="bg-accent/5 px-3 py-1 rounded-lg border border-accent/10">{item.cat_prd_id}</span>
                      </td>
                    )}
                    {!isHidden("cat_prd_nombre") && (
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-100 text-slate-400 group-hover:text-accent transition-colors">
                            <Layers className="h-4 w-4" />
                          </div>
                          <p className="font-bold text-slate-700 text-sm tracking-tight">{item.cat_prd_nombre}</p>
                        </div>
                      </td>
                    )}
                    {!isHidden("cat_prd_prefijo") && (
                      <td className="px-8 py-4 text-center">
                        <Badge variant="outline" className="font-mono text-xs font-black uppercase border-slate-200 text-slate-500">
                          {item.cat_prd_prefijo || "---"}
                        </Badge>
                      </td>
                    )}
                    {!isHidden("cat_prd_numerador") && (
                      <td className="px-8 py-4 text-center font-mono text-sm text-slate-500">
                        {item.cat_prd_numerador || 0}
                      </td>
                    )}
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 gap-2 border-slate-200 hover:bg-slate-50 transition-all px-3 font-bold text-xs shadow-sm text-slate-600">
                           <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" /> Editar
                         </Button>
                         <Button onClick={() => handleDeleteClick(item)} variant="outline" size="icon" className="h-8 w-8 text-red-500 border-transparent hover:bg-red-50 transition-all">
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
          {!loading && filteredData.length > 0 && (
            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/20">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                Mostrando <span className="text-slate-600 font-black">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="text-slate-600 font-black">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> de <span className="text-slate-600 font-black">{filteredData.length}</span> registros
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} title="Primero"><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} title="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
                
                <div className="flex items-center gap-1 mx-2">
                  <Badge variant="secondary" className="h-8 w-8 flex items-center justify-center p-0 rounded-lg bg-accent/10 text-accent font-bold border-accent/20">
                    {currentPage}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-black uppercase px-1">de</span>
                  <span className="text-[10px] text-slate-400 font-black uppercase px-1">{totalPages || 1}</span>
                </div>

                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} title="Siguiente"><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} title="Último"><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`${editingItem ? 'Editar' : 'Nueva'} Categoría`}
        className="max-w-md shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-white/50 backdrop-blur-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {!isHidden("cat_prd_nombre") && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-slate-700 font-bold">Nombre Categoría <Layers className="h-3 w-3 text-accent" /></Label>
              <Input 
                value={formData.nombre} 
                onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                placeholder="Ej: ELECTRONICA, MUEBLES, etc." 
                required 
                autoFocus
                className="h-11 bg-white border-slate-200 text-slate-950 font-medium shadow-sm"
                disabled={isReadOnly("cat_prd_nombre")}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {!isHidden("cat_prd_prefijo") && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-700 font-bold">Prefijo <Type className="h-3 w-3 text-accent" /></Label>
                <Input 
                  value={formData.prefijo} 
                  onChange={e => setFormData({ ...formData, prefijo: e.target.value.toUpperCase().slice(0, 5) })} 
                  placeholder="Ej: ELEC" 
                  className="h-11 font-mono font-bold uppercase bg-white border-slate-200 text-slate-950"
                  disabled={isReadOnly("cat_prd_prefijo")}
                />
                <p className="text-[10px] text-muted italic">Máx 5 carac.</p>
              </div>
            )}
            {!isHidden("cat_prd_numerador") && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-700 font-bold">Numerador <Binary className="h-3 w-3 text-accent" /></Label>
                <Input 
                  type="number"
                  value={formData.numerador} 
                  onChange={e => setFormData({ ...formData, numerador: e.target.value })} 
                  placeholder="0" 
                  className="h-11 font-mono font-bold bg-white border-slate-200 text-slate-950"
                  disabled={isReadOnly("cat_prd_numerador")}
                />
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-accent text-white font-bold h-12 rounded-2xl shadow-lg shadow-accent/20 flex gap-2 uppercase tracking-tighter transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:scale-100">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? "Guardando..." : "Guardar Categoría"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-tighter text-slate-500 border-slate-200">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={onConfirmDelete} 
        title="¿Eliminar Categoría?" 
        description="Esta acción eliminará la categoría. No podrá deshacerse." 
        variant="light"
      />
    </div>
  );
}
