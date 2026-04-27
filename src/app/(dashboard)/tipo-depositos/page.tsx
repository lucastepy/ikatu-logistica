"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CustomModal } from "@/components/ui/dialog-custom";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { 
  Plus, Database, Edit3, Trash2, CheckCircle2, Save, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search 
} from "lucide-react";

interface TipoDeposito {
  tipo_dep_id: number;
  tipo_dep_dsc: string;
  tipo_dep_estado: boolean;
}

export default function TipoDepositosPage() {
  const [data, setData] = useState<TipoDeposito[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<TipoDeposito | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    dsc: "",
    estado: true
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tipo-depositos");
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
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
    setFormData({ dsc: "", estado: true });
    setIsModalOpen(true);
  };

  const openEdit = (item: TipoDeposito) => {
    setEditingItem(item);
    setFormData({ dsc: item.tipo_dep_dsc, estado: item.tipo_dep_estado });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dsc.trim()) return;

    const res = await fetch("/api/admin/tipo-depositos", {
      method: "POST",
      body: JSON.stringify({ 
        id: editingItem?.tipo_dep_id, 
        dsc: formData.dsc, 
        estado: formData.estado,
        isEdit: !!editingItem 
      }),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      setIsModalOpen(false);
      showToast(editingItem ? "Registro actualizado" : "Registro creado");
      fetchData();
    }
  };

  const handleDeleteClick = (id: number) => {
    setItemToDelete(id);
    setIsConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!itemToDelete) return;
    const res = await fetch(`/api/admin/tipo-depositos?id=${itemToDelete}`, { method: "DELETE" });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Registro eliminado");
      fetchData();
    }
  };

  const filteredData = data.filter(item => 
    item.tipo_dep_dsc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
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
          <h1 className="text-3xl font-bold tracking-tight text-accent">Tipos de Depósitos</h1>
          <p className="text-muted mt-1 font-medium">Administra las diferentes categorías de depósitos del sistema.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold shadow-lg shadow-accent/20 flex gap-2 h-11 px-6 rounded-xl hover:brightness-105 transition-all">
          <Plus className="h-4 w-4 stroke-[3]" /> Nuevo Tipo
        </Button>
      </div>

      <Card className="bg-card border-none shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 space-y-4">
           <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-slate-700 focus:outline-none">Registros Configurables</CardTitle>
                <CardDescription className="text-xs">Visualiza y gestiona las clasificaciones de depósitos.</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Buscar por descripción..." 
                  className="h-9 border-slate-200 bg-white w-64 pl-9 text-sm focus-visible:ring-accent" 
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
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] uppercase tracking-widest text-slate-400 font-black">
                  <th className="px-8 py-4 w-24 text-center">ID</th>
                  <th className="px-8 py-4">Descripción del Tipo</th>
                  <th className="px-8 py-4 text-center">Estado</th>
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400 italic">Sincronizando con el servidor...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400 italic">No se encontraron depósitos con ese criterio.</td></tr>
                ) : currentItems.map((item) => (
                  <tr key={item.tipo_dep_id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-4 font-mono text-[11px] text-accent font-bold text-center">#{item.tipo_dep_id}</td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/5 text-accent">
                          <Database className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-slate-700">{item.tipo_dep_dsc}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <Badge className={`text-[9px] font-black tracking-widest border-none px-2.5 py-0.5 ${
                        item.tipo_dep_estado 
                        ? "bg-emerald-500/10 text-emerald-600" 
                        : "bg-red-500/10 text-red-600"
                      }`}>
                        {item.tipo_dep_estado ? "ACTIVO" : "INACTIVO"}
                      </Badge>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(item)} className="h-8 flex items-center gap-2 border border-slate-200 hover:bg-slate-50 transition-all px-3 font-bold text-xs shadow-sm text-slate-600 rounded-lg">
                          <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" /> Editar
                        </button>
                        <button onClick={() => handleDeleteClick(item.tipo_dep_id)} className="h-8 w-8 flex items-center justify-center text-red-500 hover:bg-red-50 transition-all rounded-lg">
                          <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Paginación */}
          {!loading && (
            <div className="flex items-center justify-between px-8 py-5 bg-slate-50/30 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Mostrando <span className="text-slate-700">{filteredData.length > 0 ? startIndex + 1 : 0}</span> a <span className="text-slate-700">{Math.min(startIndex + itemsPerPage, filteredData.length)}</span> de {filteredData.length}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => goToPage(1)} disabled={currentPage === 1 || totalPages <= 1}><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || totalPages <= 1}><ChevronLeft className="h-4 w-4" /></Button>
                
                <div className="flex items-center gap-1.5 px-4 h-8 bg-white border border-slate-200 rounded-lg text-xs font-bold text-accent">
                   {currentPage} <span className="text-slate-300 font-normal">de</span> {totalPages || 1}
                </div>

                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || totalPages <= 1}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages || totalPages <= 1}><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Editar Tipo de Depósito" : "Crear Tipo de Depósito"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Descripción del Tipo</Label>
            <Input 
              value={formData.dsc} 
              onChange={(e) => setFormData({...formData, dsc: e.target.value})} 
              placeholder="Ej: Cámara Fría, General, Mercadería..."
              className="h-11 border-slate-200 focus-visible:ring-accent font-medium rounded-xl"
              required 
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
             <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Estado del Registro</Label>
                <p className="text-[10px] text-slate-400 font-medium">Define si el tipo estará disponible para su uso.</p>
             </div>
             <input 
                type="checkbox" 
                checked={formData.estado} 
                onChange={e => setFormData({...formData, estado: e.target.checked})}
                className={`h-5 w-5 accent-accent ${!editingItem ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                disabled={!editingItem}
             />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-accent text-white font-bold h-12 rounded-xl gap-2 shadow-lg shadow-accent/20"><Save className="h-4 w-4" /> {editingItem ? "Actualizar Registro" : "Guardar Registro"}</Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={onConfirmDelete} 
        title="¿Eliminar Tipo de Depósito?" 
        description="Esta acción eliminará permanentemente la categoría de la base de datos." 
      />
    </div>
  );
}
