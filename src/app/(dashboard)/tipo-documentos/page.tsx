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
  FileText,
  Hash,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TipoDocumentosPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    id: "",
    dsc: ""
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tipo-documentos");
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
    setFormData({ id: "", dsc: "" });
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ id: item.tip_doc_id, dsc: item.tip_doc_dsc });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/admin/tipo-documentos/${editingItem.tip_doc_id}` : "/api/admin/tipo-documentos";

    // Obtener el usuario logueado
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const usuarioPk = user?.id?.toString() || "SISTEMA";

    const res = await fetch(url, {
      method,
      body: JSON.stringify({ ...formData, usuario: usuarioPk }),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      setIsModalOpen(false);
      showToast(editingItem ? "Registro actualizado" : "Registro creado");
      fetchData();
    } else {
      const err = await res.json();
      showToast(err.error || "Error al procesar");
    }
  };

  const handleDeleteClick = (item: any) => {
    setItemToDelete(item);
    setIsConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!itemToDelete) return;
    const res = await fetch(`/api/admin/tipo-documentos/${itemToDelete.tip_doc_id}`, { method: "DELETE" });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Registro eliminado");
      fetchData();
    } else {
       const err = await res.json();
       showToast(err.error || "No se pudo eliminar");
    }
  };

  const filteredData = data.filter(item => 
    item.tip_doc_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tip_doc_dsc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          <h1 className="text-3xl font-bold tracking-tight text-accent">Tipos de Documentos</h1>
          <p className="text-muted mt-1 font-medium italic">Gestión de códigos y descripciones para documentos de identidad.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold hover:brightness-105 h-11 px-6 rounded-xl shadow-lg shadow-accent/20 transition-all">
          <Plus className="h-4 w-4 mr-2 stroke-[3]" /> Nuevo Tipo
        </Button>
      </div>

      <Card className="bg-card border-none shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
           <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-slate-700">Catálogo de Documentos</CardTitle>
                <CardDescription className="text-xs">Parámetros globales para identificación de personal.</CardDescription>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                <Input placeholder="Buscar por código o descripción..." className="h-9 border-slate-200 bg-white w-80 pl-9 text-sm rounded-xl focus:ring-accent" value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] tracking-tight text-slate-400 font-bold uppercase">
                  <th className="px-8 py-4 w-32 text-center">Código (ID)</th>
                  <th className="px-8 py-4">Descripción del Documento</th>
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={3} className="px-8 py-10 text-center text-slate-400 italic">Cargando datos...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={3} className="px-8 py-10 text-center text-slate-400 italic">No se encontraron registros.</td></tr>
                ) : currentItems.map((item) => (
                  <tr key={item.tip_doc_id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-4 font-mono text-[11px] text-accent font-black text-center">
                       <span className="bg-accent/5 px-3 py-1 rounded-lg border border-accent/10">{item.tip_doc_id}</span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-100 text-slate-400 group-hover:text-accent transition-colors">
                          <FileText className="h-4 w-4" />
                        </div>
                        <p className="font-bold text-slate-700 text-sm tracking-tight">{item.tip_doc_dsc}</p>
                      </div>
                    </td>
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
          {/* Paginación Estandarizada */}
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

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${editingItem ? 'Editar' : 'Nuevo'} Tipo de Documento`}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">Código (ID) <Hash className="h-3 w-3 text-slate-300" /></Label>
            <Input 
              value={formData.id} 
              onChange={e => setFormData({...formData, id: e.target.value.toUpperCase().slice(0, 3)})} 
              placeholder="Ej: CI, PAS, RUC..." 
              required 
              disabled={!!editingItem}
              autoFocus={!editingItem}
              className="font-mono font-bold uppercase tracking-widest"
            />
            <p className="text-[10px] text-muted italic font-medium">Máximo 3 caracteres (ej: CIN, DNI).</p>
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2">Descripción <FileText className="h-3 w-3 text-slate-300" /></Label>
            <Input 
              value={formData.dsc} 
              onChange={e => setFormData({...formData, dsc: e.target.value})} 
              placeholder="Ej: Cédula de Identidad" 
              required 
              autoFocus={!!editingItem}
            />
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="submit" className="flex-1 bg-accent text-white font-bold h-12 rounded-2xl shadow-lg shadow-accent/20 flex gap-2 uppercase tracking-tighter transition-all hover:scale-[1.02] active:scale-95"><Save className="h-4 w-4" /> Guardar Registro</Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-tighter text-slate-500">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title="¿Eliminar Tipo de Documento?" description="Esta acción es permanente. No se podrá eliminar si existen registros que utilicen este tipo de documento." />
    </div>
  );
}
