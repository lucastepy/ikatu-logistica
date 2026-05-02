"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomModal } from "@/components/ui/dialog-custom";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { 
  Plus, Edit3, Trash2, CheckCircle2, Save, Search, 
  ChevronLeft, ChevronRight, Wallet, Hash, Type, Loader2
} from "lucide-react";
import { getLoggedUserEmail } from "@/lib/auth-utils";
import { Badge } from "@/components/ui/badge";
import { useFieldSecurity } from "@/hooks/useFieldSecurity";

export default function TipoPuntosCobroPage() {
  const { isHidden, isReadOnly, loadingRestrictions } = useFieldSecurity("TipoPuntoCobro");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const [formData, setFormData] = useState({
    id: "",
    nombre: ""
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

      const res = await fetch("/api/tipo-puntos-cobro", {
        headers: {
          "x-tenant-id": tenantId,
          "x-user-email": user?.email || "",
          "x-user-profile": user?.perfil_cod?.toString() || ""
        }
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ id: "", nombre: "" });
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      id: item.tip_pun_cob_id.toString(),
      nombre: item.tip_pun_cob_nombre
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const tenantId = user?.tenantId || "public";
      const usuarioEmail = user?.email || "";
      const method = editingItem ? "PUT" : "POST";
      const url = editingItem ? `/api/tipo-puntos-cobro/${editingItem.tip_pun_cob_id}` : "/api/tipo-puntos-cobro";

      const res = await fetch(url, { 
        method, 
        body: JSON.stringify({ ...formData, usuario: usuarioEmail }), 
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
        showToast(err.error || "Error al guardar");
      }
    } catch (e) {
      console.error(e);
      showToast("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredData = data.filter(item => 
    item.tip_pun_cob_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tip_pun_cob_id.toString().includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loadingRestrictions && loading) {
    return <div className="h-screen flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Sincronizando Seguridad...</div>;
  }

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-8">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/50 backdrop-blur-xl">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="font-bold text-sm">{toast}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Tipos de Puntos de Cobro</h1>
          <p className="text-muted mt-1 font-medium italic">Definición de las categorías para los puntos de recaudación.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold hover:brightness-105 h-11 px-6 rounded-xl shadow-lg shadow-accent/20 transition-all">
          <Plus className="h-4 w-4 mr-2 stroke-[3]" /> Nuevo Tipo
        </Button>
      </div>

      <Card className="bg-card border-none shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
           <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-slate-700">Listado de Categorías</CardTitle>
                <CardDescription className="text-xs">Visualización y gestión de tipos de cobro.</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                <Input 
                  placeholder="Buscar..." 
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
                  {!isHidden("tip_pun_cob_nombre") && <th className="px-8 py-4">Nombre de la Categoría</th>}
                  <th className="px-8 py-4">Última Modificación</th>
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={3} className="px-8 py-10 text-center text-slate-400 italic">Cargando...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={3} className="px-8 py-10 text-center text-slate-400 italic">No hay registros.</td></tr>
                ) : currentItems.map((item) => (
                  <tr key={item.tip_pun_cob_id} className="hover:bg-slate-50/30 transition-colors">
                    {!isHidden("tip_pun_cob_nombre") && (
                      <td className="px-8 py-4">
                         <span className="font-bold text-slate-700">{item.tip_pun_cob_nombre}</span>
                      </td>
                    )}
                     <td className="px-8 py-4">
                        <div className="flex flex-col text-[10px]">
                          <span className="text-slate-500 font-bold uppercase">{item.usuario_mod_nombre || item.usuario_alta_nombre}</span>
                          <span className="text-slate-400 italic">{new Date(item.fecha_mod || item.fecha_alta).toLocaleString()}</span>
                        </div>
                     </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 gap-2 border-slate-200 hover:bg-slate-50 px-3 font-bold text-xs text-slate-600"><Edit3 className="h-3.5 w-3.5 stroke-[2.5]" /> Editar</Button>
                         <Button onClick={() => {setItemToDelete(item); setIsConfirmOpen(true);}} variant="outline" size="icon" className="h-8 w-8 text-red-500 border-transparent hover:bg-red-50"><Trash2 className="h-3.5 w-3.5 stroke-[2.5]" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
             <span className="text-[11px] font-bold text-slate-400 uppercase">Total: {filteredData.length} Registros</span>
             <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setCurrentPage(Math.max(1, currentPage-1))} disabled={currentPage===1}>Anterior</Button>
                <div className="flex items-center px-4 bg-white border border-slate-200 rounded-lg text-xs font-bold text-accent">{currentPage} / {totalPages || 1}</div>
                <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setCurrentPage(Math.min(totalPages, currentPage+1))} disabled={currentPage===totalPages || totalPages === 0}>Siguiente</Button>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* MODAL ABM */}
      <CustomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`${editingItem ? 'Editar' : 'Nuevo'} Tipo de Punto de Cobro`}
        className="max-w-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-white/50 backdrop-blur-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
           <div className="bg-accent/5 p-4 rounded-2xl border border-accent/10 flex items-center gap-4 mb-2">
              <div className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center">
                 <Wallet className="h-5 w-5" />
              </div>
              <div>
                 <p className="text-sm font-bold text-slate-700 leading-tight">Configuración de Categoría</p>
                 <p className="text-[11px] text-slate-500 italic">Complete los datos básicos de la categoría.</p>
              </div>
           </div>

           <div className="space-y-4">
              {!isHidden("tip_pun_cob_nombre") && (
                <div className="space-y-2">
                   <Label className="flex items-center gap-2"><Type className="h-3 w-3 text-accent" /> Nombre de la Categoría</Label>
                   <Input 
                     value={formData.nombre} 
                     onChange={e => setFormData({...formData, nombre: e.target.value})} 
                     placeholder="Ej: EFECTIVO, TARJETA..." 
                     required 
                     autoFocus
                     className="h-12 rounded-xl text-slate-950 font-medium border-slate-200 focus:border-accent focus:ring-accent bg-white shadow-sm placeholder:text-slate-400"
                     disabled={isReadOnly("tip_pun_cob_nombre")}
                   />
                </div>
              )}
           </div>

           <div className="flex gap-3 pt-6">
              <Button type="submit" disabled={isSubmitting} className="flex-1 bg-accent text-white font-bold h-12 rounded-2xl shadow-lg flex gap-2 uppercase tracking-tighter transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:scale-100">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-tighter text-slate-500">Cancelar</Button>
           </div>
        </form>
      </CustomModal>

      {/* CONFIRM DELETE */}
      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={async () => {
          if (!itemToDelete) return;
          const userJson = localStorage.getItem("user");
          const user = userJson ? JSON.parse(userJson) : null;
          const tenantId = user?.tenantId || "public";

          const res = await fetch(`/api/tipo-puntos-cobro/${itemToDelete.tip_pun_cob_id}`, { 
            method: "DELETE",
            headers: {
              "x-tenant-id": tenantId,
              "x-user-email": user?.email || "",
              "x-user-profile": user?.perfil_cod?.toString() || ""
            }
          });
          if (res.ok) { setIsConfirmOpen(false); showToast("Registro eliminado"); fetchData(); }
        }} 
        title="¿Eliminar Registro?" 
        description="Esta acción eliminará la categoría permanentemente." 
      />
    </div>
  );
}
