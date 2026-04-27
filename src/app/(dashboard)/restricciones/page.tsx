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
  Table2, 
  Columns, 
  EyeOff, 
  Lock, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Save, 
  Unlock,
  Eye,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Restriccion {
  id: number;
  tabla: string;
  columna: string;
  oculto: boolean | null;
  editable: boolean | null;
  creado_en: string | null;
}

export default function RestriccionesPage() {
  const [restricciones, setRestricciones] = useState<Restriccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Restriccion | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [tables, setTables] = useState<string[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  
  const [formData, setFormData] = useState({
    tabla: "",
    columna: "",
    oculto: false,
    editable: true
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/restricciones");
      const data = await res.json();
      setRestricciones(Array.isArray(data) ? data : []);
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

  const fetchSchemaTables = async () => {
    setLoadingSchema(true);
    try {
      const res = await fetch("/api/admin/db-schema");
      const data = await res.json();
      setTables(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading tables:", e);
    } finally {
      setLoadingSchema(false);
    }
  };

  useEffect(() => {
    if (!formData.tabla) {
      setColumns([]);
      return;
    }

    const fetchSchemaColumns = async () => {
      setLoadingSchema(true);
      try {
        const res = await fetch(`/api/admin/db-schema?table=${formData.tabla}`);
        const data = await res.json();
        setColumns(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error loading columns:", e);
      } finally {
        setLoadingSchema(false);
      }
    };

    fetchSchemaColumns();
  }, [formData.tabla]);

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ tabla: "", columna: "", oculto: false, editable: true });
    fetchSchemaTables();
    setIsModalOpen(true);
  };

  const openEdit = (item: Restriccion) => {
    setEditingItem(item);
    setFormData({ 
      tabla: item.tabla, 
      columna: item.columna, 
      oculto: !!item.oculto, 
      editable: !!item.editable 
    });
    fetchSchemaTables();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/admin/restricciones/${editingItem.id}` : "/api/admin/restricciones";

    const res = await fetch(url, {
      method,
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      setIsModalOpen(false);
      showToast(editingItem ? "Restricción actualizada" : "Restricción creada");
      fetchData();
    }
  };

  const handleDeleteClick = (id: number) => {
    setItemToDelete(id);
    setIsConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!itemToDelete) return;
    const res = await fetch(`/api/admin/restricciones/${itemToDelete}`, { method: "DELETE" });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Restricción eliminada");
      fetchData();
    }
  };

  // Lógica de Paginación
  const totalPages = Math.ceil(restricciones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRestricciones = restricciones.slice(startIndex, startIndex + itemsPerPage);

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
          <h1 className="text-3xl font-bold tracking-tight text-accent">Restricciones de Campos</h1>
          <p className="text-muted mt-1">Controla la visibilidad y edición de columnas por tabla.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold shadow-lg flex gap-2">
          <Plus className="h-4 w-4" /> Nueva Restricción
        </Button>
      </div>

      <Card className="bg-card border-border shadow-xl overflow-hidden">
        <CardHeader className="border-b bg-background/50">
          <CardTitle className="text-lg">Reglas de Gobernanza</CardTitle>
          <CardDescription>Define qué campos están ocultos o bloqueados en la interfaz.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-background/30 text-xs uppercase tracking-widest text-muted font-bold">
                  <th className="px-6 py-4">Tabla</th>
                  <th className="px-6 py-4">Columna / Campo</th>
                  <th className="px-6 py-4 text-center">Visibilidad</th>
                  <th className="px-6 py-4 text-center">Edición</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted italic">Cargando reglas...</td></tr>
                ) : currentRestricciones.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted italic">No hay restricciones configuradas.</td></tr>
                ) : currentRestricciones.map((item) => (
                  <tr key={item.id} className="hover:bg-background/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold text-slate-700">
                        <Table2 className="h-4 w-4 text-slate-400" />
                        {item.tabla}
                      </div>
                    </td>
                    <td className="px-6 py-4 italic font-medium text-slate-500">
                      <div className="flex items-center gap-2">
                        <Columns className="h-4 w-4 text-slate-300" />
                        {item.columna}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={`font-black text-[9px] tracking-tight ${item.oculto ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                        {item.oculto ? <><EyeOff className="h-3 w-3 mr-1" /> OCULTO</> : <><Eye className="h-3 w-3 mr-1" /> VISIBLE</>}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={`font-black text-[9px] tracking-tight ${!item.editable ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'}`}>
                        {!item.editable ? <><Lock className="h-3 w-3 mr-1" /> SOLO LECTURA</> : <><Unlock className="h-3 w-3 mr-1" /> EDITABLE</>}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 gap-2 border-border hover:bg-background group-hover:border-accent group-hover:text-accent transition-all px-3 font-bold text-xs">
                          <Edit3 className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button onClick={() => handleDeleteClick(item.id)} variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 border-transparent hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button>
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
                Mostrando <span className="text-foreground font-bold">{restricciones.length > 0 ? startIndex + 1 : 0}</span> a <span className="text-foreground font-bold">{Math.min(startIndex + itemsPerPage, restricciones.length)}</span> de <span className="text-foreground font-bold">{restricciones.length}</span> reglas
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

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Editar Restricción" : "Nueva Restricción"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Tabla de Base de Datos</Label>
            <select 
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.tabla}
              onChange={e => setFormData({...formData, tabla: e.target.value})}
              required
            >
              <option value="">Seleccionar una tabla...</option>
              {tables.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Campo / Columna</Label>
            <select 
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.columna}
              onChange={e => setFormData({...formData, columna: e.target.value})}
              required
              disabled={!formData.tabla || loadingSchema}
            >
              <option value="">{loadingSchema ? "Cargando columnas..." : "Seleccionar una columna..."}</option>
              {columns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div 
              onClick={() => setFormData({...formData, oculto: !formData.oculto})}
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${formData.oculto ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'}`}
            >
              <div className={`p-2 rounded-lg ${formData.oculto ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-slate-400 border border-slate-200'}`}>
                <EyeOff className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Oculto</p>
                <p className="text-[10px] text-muted-foreground font-medium">No se muestra en UI</p>
              </div>
            </div>

            <div 
              onClick={() => setFormData({...formData, editable: !formData.editable})}
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${!formData.editable ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}
            >
              <div className={`p-2 rounded-lg ${!formData.editable ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-blue-500 text-white shadow-lg shadow-blue-200'}`}>
                {formData.editable ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">{formData.editable ? 'Editable' : 'Solo Lectura'}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{formData.editable ? 'Permite cambios' : 'Campo bloqueado'}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-accent text-white font-bold gap-2"><Save className="h-4 w-4" /> {editingItem ? "Actualizar Regla" : "Guardar Regla"}</Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title="¿Eliminar Regla?" description="Al eliminar esta restricción, el campo volverá a su estado por defecto." />
    </div>
  );
}
