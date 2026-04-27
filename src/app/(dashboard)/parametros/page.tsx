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
  Settings2, 
  Code2, 
  FileText, 
  Binary, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Save, 
  Hash,
  Image as ImageIcon,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Parametro {
  par_id: number;
  par_codigo: string;
  par_descripcion: string;
  par_valor: string;
  par_tenantid: number;
}

export default function ParametrosPage() {
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Parametro | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    codigo: "",
    descripcion: "",
    valor: "",
    tenantId: "1"
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/parametros");
      const data = await res.json();
      setParametros(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching data:", e);
    } finally {
      setLoading(false);
    }
  };

  const isBase64Image = (str: string) => {
    return str.startsWith('data:image/') && str.includes(';base64,');
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ codigo: "", descripcion: "", valor: "", tenantId: "1" });
    setIsModalOpen(true);
  };

  const openEdit = (item: Parametro) => {
    setEditingItem(item);
    setFormData({ 
      codigo: item.par_codigo, 
      descripcion: item.par_descripcion, 
      valor: item.par_valor, 
      tenantId: item.par_tenantid.toString() 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/admin/parametros/${editingItem.par_id}` : "/api/admin/parametros";

    const res = await fetch(url, {
      method,
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      setIsModalOpen(false);
      showToast(editingItem ? "Parámetro actualizado" : "Parámetro creado");
      fetchData();
    }
  };

  const handleDeleteClick = (id: number) => {
    setItemToDelete(id);
    setIsConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!itemToDelete) return;
    const res = await fetch(`/api/admin/parametros/${itemToDelete}`, { method: "DELETE" });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Parámetro eliminado");
      fetchData();
    }
  };

  // Lógica de Paginación
  const totalPages = Math.ceil(parametros.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentParams = parametros.slice(startIndex, startIndex + itemsPerPage);

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
          <h1 className="text-3xl font-bold tracking-tight text-accent">Configuración de Parámetros</h1>
          <p className="text-muted mt-1">Administra las constantes y variables globales del sistema.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold shadow-lg flex gap-2">
          <Plus className="h-4 w-4" /> Nuevo Parámetro
        </Button>
      </div>

      <Card className="bg-card border-border shadow-xl overflow-hidden">
        <CardHeader className="border-b bg-background/50">
          <CardTitle className="text-lg">Parámetros del Sistema</CardTitle>
          <CardDescription>Variables técnicas configuradas para el funcionamiento distribuido.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-background/30 text-xs uppercase tracking-widest text-muted font-bold">
                  <th className="px-6 py-4 w-24">Código</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4 text-center">Tenant</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted italic">Cargando parámetros...</td></tr>
                ) : currentParams.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted italic">No hay parámetros configurados.</td></tr>
                ) : currentParams.map((item) => (
                  <tr key={item.par_id} className="hover:bg-background/40 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-accent">
                      {item.par_codigo}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium text-slate-700">
                        <FileText className="h-4 w-4 text-slate-400" />
                        {item.par_descripcion}
                      </div>
                    </td>
                    <td className="px-6 py-4 italic font-medium text-slate-500 max-w-xs">
                      {isBase64Image(item.par_valor) ? (
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm transition-transform hover:scale-150 z-10">
                            <img 
                              src={item.par_valor} 
                              alt="preview" 
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="flex flex-col">
                            <Badge variant="outline" className="bg-blue-500/5 text-blue-600 border-blue-500/10 text-[9px] font-black w-fit">IMAGEN BASE64</Badge>
                            <span className="text-[10px] text-slate-300 font-mono italic truncate w-32">{item.par_valor.substring(0, 20)}...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Binary className="h-4 w-4 text-slate-300" />
                          <span className="truncate max-w-[200px]">{item.par_valor}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className="font-black text-[10px] tracking-widest bg-slate-100/50">
                        ID: {item.par_tenantid}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 gap-2 border-border hover:bg-background group-hover:border-accent group-hover:text-accent transition-all px-3 font-bold text-xs">
                          <Edit3 className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button onClick={() => handleDeleteClick(item.par_id)} variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 border-transparent hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button>
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
                Mostrando <span className="text-foreground font-bold">{parametros.length > 0 ? startIndex + 1 : 0}</span> a <span className="text-foreground font-bold">{Math.min(startIndex + itemsPerPage, parametros.length)}</span> de <span className="text-foreground font-bold">{parametros.length}</span> parámetros
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

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Editar Parámetro" : "Nuevo Parámetro"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Código del Parámetro</Label>
            <Input 
              value={formData.codigo} 
              onChange={(e) => setFormData({...formData, codigo: e.target.value})} 
              placeholder="Ej: SMTP_HOST, APP_VER..."
              required 
              autoFocus
              disabled={!!editingItem} // El código suele ser el identificador de negocio
            />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input 
              value={formData.descripcion} 
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})} 
              placeholder="Descripción breve de su función"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Valor del Parámetro</Label>
            <Input 
              value={formData.valor} 
              onChange={(e) => setFormData({...formData, valor: e.target.value})} 
              placeholder="Introduce el valor asignado"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>ID de Tenant</Label>
            <div className="relative">
              <Input 
                type="number"
                value={formData.tenantId} 
                onChange={(e) => setFormData({...formData, tenantId: e.target.value})} 
                required 
              />
              <Hash className="absolute right-3 top-2.5 h-4 w-4 text-muted opacity-30" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-accent text-white font-bold gap-2"><Save className="h-4 w-4" /> {editingItem ? "Actualizar" : "Guardar Parámetro"}</Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title="¿Eliminar Parámetro?" description="Si eliminas este parámetro, algunas funciones del sistema podrían dejar de operar correctamente." />
    </div>
  );
}
