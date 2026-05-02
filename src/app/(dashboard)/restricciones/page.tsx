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
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Restriccion {
  res_cam_id: number;
  res_cam_tabla: string;
  res_cam_columna: string;
  res_cam_oculto: boolean | null;
  res_cam_editable: boolean | null;
  res_cam_fecha_alta: string | null;
  perfiles?: { perfil: { perfil_cod: number; perfil_nombre: string } }[];
  usuarios?: { usuario: { usuario_email: string; usuario_nombre: string } }[];
}

export default function RestriccionesPage() {
  const [restricciones, setRestricciones] = useState<Restriccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const [allPerfiles, setAllPerfiles] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  
  const [formData, setFormData] = useState({
    tabla: "",
    columna: "",
    oculto: false,
    editable: true,
    perfiles: [] as number[],
    usuarios: [] as string[]
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

  const fetchAuxData = async () => {
    try {
      const [pRes, uRes] = await Promise.all([
        fetch("/api/admin/perfiles"),
        fetch("/api/admin/users")
      ]);
      const pData = await pRes.json();
      const uData = await uRes.json();
      setAllPerfiles(Array.isArray(pData) ? pData : []);
      setAllUsers(Array.isArray(uData) ? uData : []);
    } catch (e) {
      console.error("Error fetching aux data:", e);
    }
  };

  useEffect(() => {
    fetchData();
    fetchAuxData();
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
    setFormData({ 
      tabla: "", 
      columna: "", 
      oculto: false, 
      editable: true,
      perfiles: [],
      usuarios: []
    });
    fetchSchemaTables();
    setIsModalOpen(true);
  };

  const openEdit = (item: Restriccion) => {
    setEditingItem(item);
    setFormData({ 
      tabla: item.res_cam_tabla, 
      columna: item.res_cam_columna, 
      oculto: !!item.res_cam_oculto, 
      editable: !!item.res_cam_editable,
      perfiles: item.perfiles?.map(p => p.perfil.perfil_cod) || [],
      usuarios: item.usuarios?.map(u => u.usuario.usuario_email) || []
    });
    fetchSchemaTables();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const method = editingItem ? "PUT" : "POST";
      const url = editingItem ? `/api/admin/restricciones/${editingItem.res_cam_id}` : "/api/admin/restricciones";

      const res = await fetch(url, {
        method,
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        setIsModalOpen(false);
        showToast(editingItem ? "Restricción actualizada" : "Restricción creada");
        fetchData();
      } else {
        showToast("Error al guardar restricción");
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
    const res = await fetch(`/api/admin/restricciones/${itemToDelete}`, { method: "DELETE" });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Restricción eliminada");
      fetchData();
    }
  };

  const toggleSelection = (type: 'perfiles' | 'usuarios', val: any) => {
    const current = [...formData[type]] as any[];
    const idx = current.indexOf(val);
    if (idx > -1) current.splice(idx, 1);
    else current.push(val);
    setFormData({...formData, [type]: current});
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
          <h1 className="text-3xl font-bold tracking-tight text-[#00658d]">Gobernanza de Campos</h1>
          <p className="text-muted mt-1">Define visibilidad y permisos a nivel de tabla, perfil y usuario.</p>
        </div>
        <Button onClick={openCreate} className="bg-[#00aeef] hover:bg-[#00658d] text-white font-bold shadow-lg flex gap-2 rounded-xl h-11 px-6 transition-all">
          <Plus className="h-4 w-4" /> Nueva Regla
        </Button>
      </div>

      <Card className="bg-white border-slate-200/60 shadow-xl overflow-hidden rounded-2xl">
        <CardHeader className="border-b bg-slate-50/50 p-6">
          <div className="flex items-center gap-3 text-[#00658d]">
            <ShieldCheck className="h-5 w-5" />
            <CardTitle className="text-lg font-bold">Matriz de Restricciones</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30 text-[11px] uppercase tracking-widest text-slate-400 font-black">
                  <th className="px-8 py-5">Tabla / Origen</th>
                  <th className="px-8 py-5">Columna</th>
                  <th className="px-8 py-5">Alcance (Perfiles/Usuarios)</th>
                  <th className="px-8 py-5 text-center">Estado</th>
                  <th className="px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic font-medium"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 opacity-20" /> Cargando matriz de seguridad...</td></tr>
                ) : currentRestricciones.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic font-medium">No se han definido reglas de gobernanza.</td></tr>
                ) : currentRestricciones.map((item) => (
                  <tr key={item.res_cam_id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#00aeef]/10 group-hover:text-[#00aeef] transition-colors">
                          <Table2 className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-slate-700 text-sm">{item.res_cam_tabla}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <Columns className="h-3.5 w-3.5 text-slate-300" />
                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{item.res_cam_columna}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                        {(!item.perfiles?.length && !item.usuarios?.length) && (
                          <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 text-[9px] font-bold">GLOBAL (TODOS)</Badge>
                        )}
                        {item.perfiles?.map(p => (
                          <Badge key={p.perfil.perfil_cod} className="bg-[#dae2fd] text-[#3f465c] border-transparent text-[9px] font-bold">
                            P: {p.perfil.perfil_nombre}
                          </Badge>
                        ))}
                        {item.usuarios?.map(u => (
                          <Badge key={u.usuario.usuario_email} className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-bold">
                            U: {u.usuario.usuario_nombre}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <Badge className={`h-6 rounded-full px-3 text-[9px] font-black tracking-widest ${item.res_cam_oculto ? 'bg-orange-500 shadow-lg shadow-orange-500/20' : 'bg-emerald-500 shadow-lg shadow-emerald-500/20'}`}>
                          {item.res_cam_oculto ? 'OCULTO' : 'VISIBLE'}
                        </Badge>
                        <Badge className={`h-6 rounded-full px-3 text-[9px] font-black tracking-widest ${!item.res_cam_editable ? 'bg-red-500 shadow-lg shadow-red-500/20' : 'bg-blue-500 shadow-lg shadow-blue-500/20'}`}>
                          {!item.res_cam_editable ? 'LOCK' : 'EDIT'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 rounded-lg border-slate-200 hover:border-[#00aeef] hover:text-[#00aeef] font-bold text-[11px] bg-white">
                          <Edit3 className="h-3.5 w-3.5 mr-1" /> Editar
                        </Button>
                        <Button onClick={() => handleDeleteClick(item.res_cam_id)} variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg text-red-400 hover:bg-red-50 border-transparent">
                          <Trash2 className="h-3.5 w-3.5" />
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
            <div className="flex items-center justify-between px-8 py-5 bg-slate-50/30 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                Reglas: <span className="text-slate-700">{restricciones.length}</span> totales
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || totalPages <= 1}><ChevronLeft className="h-4 w-4" /></Button>
                <div className="px-4 text-[11px] font-black text-slate-600 bg-white border border-slate-200 rounded-lg h-8 flex items-center shadow-sm">
                  {currentPage} / {totalPages || 1}
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || totalPages <= 1}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? "Editar Regla de Seguridad" : "Configurar Nueva Restricción"}
        className="max-w-3xl shadow-[0_50px_100px_-20px_rgba(0,101,141,0.2)] border-white/40 backdrop-blur-3xl bg-white/90"
      >
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Entidad / Tabla</Label>
              <select 
                className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#00aeef] outline-none shadow-sm transition-all"
                value={formData.tabla}
                onChange={e => setFormData({...formData, tabla: e.target.value})}
                required
              >
                <option value="">Seleccionar tabla...</option>
                {tables.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Atributo / Columna</Label>
              <select 
                className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#00aeef] outline-none shadow-sm transition-all disabled:opacity-50"
                value={formData.columna}
                onChange={e => setFormData({...formData, columna: e.target.value})}
                required
                disabled={!formData.tabla || loadingSchema}
              >
                <option value="">{loadingSchema ? "Obteniendo esquema..." : "Seleccionar campo..."}</option>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Alcance por Perfil</Label>
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
                {allPerfiles.map(p => (
                  <label key={p.perfil_cod} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white cursor-pointer transition-all border border-transparent hover:border-slate-100 group">
                    <input 
                      type="checkbox" 
                      checked={formData.perfiles.includes(p.perfil_cod)}
                      onChange={() => toggleSelection('perfiles', p.perfil_cod)}
                      className="h-4 w-4 rounded-md border-slate-300 text-[#00aeef] focus:ring-[#00aeef]"
                    />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">{p.perfil_nombre}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Alcance por Usuario</Label>
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
                {allUsers.map(u => (
                  <label key={u.usuario_email} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white cursor-pointer transition-all border border-transparent hover:border-slate-100 group">
                    <input 
                      type="checkbox" 
                      checked={formData.usuarios.includes(u.usuario_email)}
                      onChange={() => toggleSelection('usuarios', u.usuario_email)}
                      className="h-4 w-4 rounded-md border-slate-300 text-[#00aeef] focus:ring-[#00aeef]"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">{u.usuario_nombre}</span>
                      <span className="text-[10px] text-slate-400">{u.usuario_email}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div 
              onClick={() => setFormData({...formData, oculto: !formData.oculto})}
              className={`flex items-center gap-4 p-5 rounded-3xl border-2 cursor-pointer transition-all ${formData.oculto ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}
            >
              <div className={`p-3 rounded-2xl ${formData.oculto ? 'bg-orange-500 text-white shadow-xl shadow-orange-200' : 'bg-slate-100 text-slate-400'}`}>
                <EyeOff className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Visibilidad</p>
                <p className="text-sm font-bold text-slate-700">{formData.oculto ? 'Campo Oculto' : 'Campo Visible'}</p>
              </div>
              <div className={`h-6 w-10 rounded-full flex items-center px-1 transition-all ${formData.oculto ? 'bg-orange-500' : 'bg-slate-200'}`}>
                <div className={`h-4 w-4 bg-white rounded-full transition-transform ${formData.oculto ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>

            <div 
              onClick={() => setFormData({...formData, editable: !formData.editable})}
              className={`flex items-center gap-4 p-5 rounded-3xl border-2 cursor-pointer transition-all ${!formData.editable ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}
            >
              <div className={`p-3 rounded-2xl ${!formData.editable ? 'bg-red-500 text-white shadow-xl shadow-red-200' : 'bg-blue-500 text-white shadow-xl shadow-blue-200'}`}>
                {formData.editable ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Permiso de Edición</p>
                <p className="text-sm font-bold text-slate-700">{formData.editable ? 'Editable' : 'Solo Lectura'}</p>
              </div>
              <div className={`h-6 w-10 rounded-full flex items-center px-1 transition-all ${formData.editable ? 'bg-blue-500' : 'bg-red-500'}`}>
                <div className={`h-4 w-4 bg-white rounded-full transition-transform ${formData.editable ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-[#00aeef] hover:bg-[#00658d] text-white font-black uppercase tracking-widest text-xs h-14 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-[#00aeef]/20">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
              {isSubmitting ? "Procesando..." : (editingItem ? "Actualizar Directiva" : "Activar Restricción")}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 rounded-2xl border-slate-200 text-slate-400 font-bold uppercase tracking-widest text-[11px] hover:bg-slate-50">Cerrar</Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title="¿Revocar Restricción?" description="Al eliminar esta directiva, los campos volverán a su comportamiento estándar para todos los usuarios." />
    </div>
  );
}
