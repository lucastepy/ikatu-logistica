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
  Truck, Type, LayoutGrid
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getLoggedUserEmail } from "@/lib/auth-utils";

export default function MovilCategoriasPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const [formData, setFormData] = useState({
    dsc: ""
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
      const res = await fetch("/api/movil-categorias");
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
    setFormData({ dsc: "" });
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      dsc: item.mov_cat_dsc
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const usuarioEmail = getLoggedUserEmail();

    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/movil-categorias/${editingItem.mov_cat_id}` : "/api/movil-categorias";
    
    const res = await fetch(url, { 
      method, 
      body: JSON.stringify({ ...formData, usuario: usuarioEmail }), 
      headers: { "Content-Type": "application/json" } 
    });

    if (res.ok) { 
      setIsModalOpen(false); 
      showToast(editingItem ? "Categoría actualizada" : "Categoría creada"); 
      fetchData(); 
    }
  };

  const filteredData = data.filter(item => 
    item.mov_cat_dsc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-8">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/50 backdrop-blur-xl">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="font-bold text-sm">{toast}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Categorías de Móviles</h1>
          <p className="text-muted mt-1 font-medium italic">Gestión de clasificaciones para la flota de vehículos.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold hover:brightness-105 h-11 px-6 rounded-xl shadow-lg shadow-accent/20 transition-all">
          <Plus className="h-4 w-4 mr-2 stroke-[3]" /> Nueva Categoría
        </Button>
      </div>

      <Card className="bg-card border-none shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
           <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-slate-700">Listado de Categorías</CardTitle>
                <CardDescription className="text-xs">Clasificaciones disponibles para móviles.</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                <Input 
                  placeholder="Buscar categoría..." 
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
                  <th className="px-8 py-4">Descripción de la Categoría</th>
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
                  <tr key={item.mov_cat_id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-4">
                       <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-accent/10">
                            <Truck className="h-4 w-4 text-accent" />
                         </div>
                         <span className="font-bold text-slate-700">{item.mov_cat_dsc}</span>
                       </div>
                    </td>
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

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${editingItem ? 'Editar' : 'Nueva'} Categoría de Móvil`}>
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
           <div className="bg-accent/5 p-4 rounded-2xl border border-accent/10 flex items-center gap-4 mb-2">
              <div className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center">
                 <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                 <p className="text-sm font-bold text-slate-700 leading-tight">Configuración de Categoría</p>
                 <p className="text-[11px] text-slate-500 italic">Especifique el nombre de la clasificación.</p>
              </div>
           </div>

           <div className="space-y-4">
              <div className="space-y-2">
                 <Label className="flex items-center gap-2"><Type className="h-3 w-3 text-accent" /> Descripción de la Categoría</Label>
                 <Input 
                   value={formData.dsc} 
                   onChange={e => setFormData({...formData, dsc: e.target.value})} 
                   placeholder="Ej: CAMIÓN, FURGÓN, MOTO..." 
                   required 
                   autoFocus
                   className="h-11 rounded-xl"
                 />
              </div>
           </div>

           <div className="flex gap-3 pt-6">
              <Button type="submit" className="flex-1 bg-accent text-white font-bold h-12 rounded-2xl shadow-lg flex gap-2 uppercase tracking-tighter"><Save className="h-4 w-4" /> Guardar Categoría</Button>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-tighter text-slate-500">Cancelar</Button>
           </div>
        </form>
      </CustomModal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={async () => {
          if (!itemToDelete) return;
          const res = await fetch(`/api/movil-categorias/${itemToDelete.mov_cat_id}`, { method: "DELETE" });
          if (res.ok) { setIsConfirmOpen(false); showToast("Categoría eliminada"); fetchData(); }
        }} 
        title="¿Eliminar Categoría?" 
        description="Esta acción eliminará la clasificación permanentemente." 
      />
    </div>
  );
}
