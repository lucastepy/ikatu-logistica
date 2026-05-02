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
  ShieldAlert, 
  EyeOff, 
  Lock, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Save, 
  Database,
  LayoutGrid,
  Users,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Search
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Restriccion {
  res_cam_id: number;
  res_cam_tabla: string;
  res_cam_columna: string;
  res_cam_oculto: boolean;
  res_cam_editable: boolean;
  res_cam_tenantid: string | null;
  perfiles: { perfil: { perfil_nombre: string } }[];
  usuarios: { usuario: { usuario_nombre: string } }[];
}

export default function RestriccionesAdminPage() {
  const [restricciones, setRestricciones] = useState<Restriccion[]>([]);
  const [listas, setListas] = useState<{perfiles: any[], usuarios: any[], schema: any[], clientes: any[]}>({
    perfiles: [],
    usuarios: [],
    schema: [],
    clientes: []
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Restriccion | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    tenantId: "",
    tabla: "",
    columna: "",
    oculto: false,
    editable: true,
    perfiles: [] as number[],
    usuarios: [] as string[]
  });

  const [userSearch, setUserSearch] = useState("");
  const [availableColumns, setAvailableColumns] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resR, resP, resC] = await Promise.all([
        fetch("/api/admin/restricciones"),
        fetch("/api/admin/perfiles"),
        fetch("/api/admin/clientes-saas")
      ]);
      
      const dataR = await resR.json();
      const dataP = await resP.json();
      const dataC = await resC.json();
      
      setRestricciones(Array.isArray(dataR) ? dataR : []);
      setListas(prev => ({
        ...prev,
        perfiles: Array.isArray(dataP) ? dataP : [],
        clientes: Array.isArray(dataC) ? dataC.filter((c: any) => c.cli_saas_tenant !== 'public') : []
      }));
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

  // Cargar tablas y usuarios al cambiar de tenant
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!formData.tenantId) {
        setListas(prev => ({ ...prev, schema: [], usuarios: [] }));
        return;
      }
      try {
        const [resS, resU] = await Promise.all([
          fetch(`/api/admin/db-schema?tenant=${formData.tenantId}`),
          fetch(`/api/admin/users?tenantId=${formData.tenantId}`)
        ]);
        const dataS = await resS.json();
        const dataU = await resU.json();
        setListas(prev => ({
          ...prev,
          schema: Array.isArray(dataS) ? dataS : [],
          usuarios: Array.isArray(dataU) ? dataU : []
        }));
      } catch (e) {
        console.error("Error fetching tenant data:", e);
      }
    };
    fetchTenantData();
  }, [formData.tenantId]);

  const fetchColumns = async (table: string) => {
    if (!table || !formData.tenantId) {
      setAvailableColumns([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/db-schema?table=${table}&tenant=${formData.tenantId}`);
      const data = await res.json();
      setAvailableColumns(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching columns:", e);
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ 
      tenantId: "",
      tabla: "", 
      columna: "", 
      oculto: false, 
      editable: true, 
      perfiles: [], 
      usuarios: [] 
    });
    setAvailableColumns([]);
    setUserSearch("");
    setIsModalOpen(true);
  };

  const openEdit = async (item: Restriccion) => {
    setEditingItem(item);
    setFormData({ 
      tenantId: item.res_cam_tenantid || "",
      tabla: item.res_cam_tabla, 
      columna: item.res_cam_columna, 
      oculto: item.res_cam_oculto, 
      editable: item.res_cam_editable, 
      perfiles: item.perfiles.map(p => (p as any).perfil_cod), 
      usuarios: item.usuarios.map(u => (u as any).usuario_email) 
    });
    
    // Para edición cargamos sincronamente lo necesario para el tenant guardado
    const tid = item.res_cam_tenantid || "";
    try {
      const [resS, resU] = await Promise.all([
        fetch(`/api/admin/db-schema?tenant=${tid}`),
        fetch(`/api/admin/users?tenantId=${tid}`)
      ]);
      const dataS = await resS.json();
      const dataU = await resU.json();
      setListas(prev => ({
        ...prev,
        schema: Array.isArray(dataS) ? dataS : [],
        usuarios: Array.isArray(dataU) ? dataU : []
      }));
      
      const resC = await fetch(`/api/admin/db-schema?table=${item.res_cam_tabla}&tenant=${tid}`);
      const dataC = await resC.json();
      setAvailableColumns(Array.isArray(dataC) ? dataC : []);
    } catch (e) {}

    setUserSearch("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenantId || !formData.tabla || !formData.columna) {
      showToast("Debe completar todos los campos obligatorios");
      return;
    }
    setIsSubmitting(true);
    try {
      const method = editingItem ? "PUT" : "POST";
      const url = editingItem 
        ? `/api/admin/restricciones/${editingItem.res_cam_id}` 
        : "/api/admin/restricciones";

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
    if (itemToDelete === null) return;
    const res = await fetch(`/api/admin/restricciones/${itemToDelete}`, { method: "DELETE" });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Restricción eliminada");
      fetchData();
    }
  };

  // Paginación
  const totalPages = Math.ceil(restricciones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = restricciones.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getTenantName = (tid: string | null) => {
    if (!tid) return "Global";
    const cli = listas.clientes.find(c => c.cli_saas_tenant === tid);
    return cli ? cli.cli_saas_nom : tid;
  };

  const filteredUsers = listas.usuarios.filter(u => 
    u.usuario_nombre.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.usuario_email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 relative min-h-screen">
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
          <h1 className="text-3xl font-extrabold tracking-tighter text-white">Gobernanza de <span className="text-red-500">Campos</span></h1>
          <p className="text-slate-400 mt-1 font-medium">Control de visibilidad y editabilidad de columnas a nivel global, por perfil o usuario.</p>
        </div>
        <Button onClick={openCreate} className="bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/20 flex gap-2 rounded-xl transition-all active:scale-95">
          <Plus className="h-4 w-4" /> Nueva Restricción
        </Button>
      </div>

      <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-800 bg-slate-950/20 p-6">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" /> Matriz de Seguridad
          </CardTitle>
          <CardDescription className="text-slate-500">Reglas activas de protección de datos en la plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/30 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                  <th className="px-6 py-4">Tenant / Instancia</th>
                  <th className="px-6 py-4">Tabla / Columna</th>
                  <th className="px-6 py-4">Alcance (Perfiles/Usuarios)</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic font-medium">Sincronizando seguridad...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic font-medium">No hay restricciones configuradas.</td></tr>
                ) : currentItems.map((res) => (
                  <tr key={res.res_cam_id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-slate-950/50 text-slate-400 border-slate-800 font-bold text-[10px] uppercase tracking-tighter">
                        <Users className="h-3 w-3 mr-1.5 opacity-50" />
                        {getTenantName(res.res_cam_tenantid)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                          <Database className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 leading-none mb-1 group-hover:text-white transition-colors">{res.res_cam_tabla}</p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold">
                            <LayoutGrid className="h-3 w-3" /> {res.res_cam_columna}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {res.perfiles.length === 0 && res.usuarios.length === 0 ? (
                          <Badge variant="outline" className="bg-slate-950/30 text-slate-500 border-slate-800 font-bold text-[9px] uppercase tracking-widest">Global</Badge>
                        ) : (
                          <>
                            {res.perfiles.map(p => (
                              <Badge key={p.perfil.perfil_nombre} variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold text-[9px] uppercase tracking-tighter flex gap-1 items-center">
                                <Users className="h-2.5 w-2.5" /> {p.perfil.perfil_nombre}
                              </Badge>
                            ))}
                            {res.usuarios.map(u => (
                              <Badge key={(u as any).usuario_email} variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 font-bold text-[9px] uppercase tracking-tighter flex gap-1 items-center">
                                <UserIcon className="h-2.5 w-2.5" /> {(u as any).usuario?.usuario_nombre || u.usuario_email}
                              </Badge>
                            ))}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {res.res_cam_oculto && (
                          <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border">OCULTO</Badge>
                        )}
                        {!res.res_cam_editable && (
                          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border text-nowrap">BLOQUEADO</Badge>
                        )}
                        {!res.res_cam_oculto && res.res_cam_editable && (
                          <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border">LIBRE</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(res)} variant="outline" size="sm" className="h-8 gap-2 border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all px-3 font-bold text-[10px] uppercase tracking-tighter">
                          <Edit3 className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button 
                          onClick={() => handleDeleteClick(res.res_cam_id)} 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-slate-600 border-slate-800 bg-slate-950/50 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {!loading && restricciones.length > 0 && (
            <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/20">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Mostrando <span className="text-white font-black">{startIndex + 1}</span> a <span className="text-white font-black">{Math.min(startIndex + itemsPerPage, restricciones.length)}</span> de <span className="text-white font-black">{restricciones.length}</span> reglas
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400" onClick={() => goToPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <div className="flex items-center gap-1 mx-2">
                  <Badge variant="secondary" className="h-8 px-3 rounded-lg bg-red-500/10 text-red-500 font-black border-red-500/20 text-xs">{currentPage}</Badge>
                  <span className="text-[10px] text-slate-600 font-black uppercase px-1">de</span>
                  <span className="text-[10px] text-slate-600 font-black uppercase px-1">{totalPages || 1}</span>
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Editar Restricción" : "Nueva Regla de Seguridad"} variant="dark" className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label className="text-white font-bold text-xs uppercase tracking-widest">Tenant / Cliente</Label>
              <select 
                className="flex h-12 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white font-medium focus:ring-2 focus:ring-red-500/50 focus:outline-none transition-all"
                value={formData.tenantId}
                onChange={e => {
                  setFormData({...formData, tenantId: e.target.value, tabla: "", columna: "", usuarios: []});
                  setAvailableColumns([]);
                }}
                required
              >
                <option value="" className="bg-slate-900">Seleccionar tenant...</option>
                {listas.clientes.map(c => <option key={c.cli_saas_cod} value={c.cli_saas_tenant} className="bg-slate-900">{c.cli_saas_nom} ({c.cli_saas_tenant})</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white font-bold text-xs uppercase tracking-widest">Tabla / Modelo</Label>
              <select 
                className="flex h-12 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white font-medium focus:ring-2 focus:ring-red-500/50 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.tabla}
                onChange={e => {
                  setFormData({...formData, tabla: e.target.value, columna: ""});
                  fetchColumns(e.target.value);
                }}
                required
                disabled={!formData.tenantId}
              >
                <option value="" className="bg-slate-900">{formData.tenantId ? "Seleccionar tabla..." : "Primero seleccione un tenant"}</option>
                {listas.schema.map((t: any) => (
                  <option key={t.name} value={t.name} className="bg-slate-900">
                    {t.name} {t.description ? `- ${t.description}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-white font-bold text-xs uppercase tracking-widest">Columna / Campo</Label>
              <select 
                className="flex h-12 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white font-medium focus:ring-2 focus:ring-red-500/50 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.columna}
                onChange={e => setFormData({...formData, columna: e.target.value})}
                required
                disabled={!formData.tabla}
              >
                <option value="" className="bg-slate-900">{formData.tabla ? "Seleccionar campo..." : "Primero seleccione una tabla"}</option>
                {availableColumns.map((c: any) => (
                  <option key={c.name} value={c.name} className="bg-slate-900">
                    {c.name} {c.description ? `- ${c.description}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Configuración de Seguridad</h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${formData.oculto ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-500'}`}>
                    <EyeOff className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white uppercase tracking-wider">Ocultar Campo</p>
                    <p className="text-[9px] text-slate-500 font-medium">No se enviará al cliente</p>
                  </div>
                </div>
                <input type="checkbox" checked={formData.oculto} onChange={e => setFormData({...formData, oculto: e.target.checked})} className="w-10 h-5 rounded-full appearance-none bg-slate-700 checked:bg-red-500 relative transition-all cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:left-5 before:transition-all" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${!formData.editable ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-500'}`}>
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white uppercase tracking-wider">Bloquear Edición</p>
                    <p className="text-[9px] text-slate-500 font-medium">Campo de solo lectura</p>
                  </div>
                </div>
                <input type="checkbox" checked={!formData.editable} onChange={e => setFormData({...formData, editable: !e.target.checked})} className="w-10 h-5 rounded-full appearance-none bg-slate-700 checked:bg-amber-500 relative transition-all cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:left-5 before:transition-all" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-blue-400" /> Alcance por Perfil
              </Label>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 h-64 overflow-y-auto space-y-1 custom-scrollbar">
                {listas.perfiles.map(p => (
                  <label key={p.perfil_cod} className="flex items-center gap-3 p-2.5 hover:bg-slate-900 rounded-lg cursor-pointer transition-colors group">
                    <input 
                      type="checkbox" 
                      checked={formData.perfiles.includes(p.perfil_cod)}
                      onChange={e => {
                        const next = e.target.checked 
                          ? [...formData.perfiles, p.perfil_cod]
                          : formData.perfiles.filter(id => id !== p.perfil_cod);
                        setFormData({...formData, perfiles: next});
                      }}
                      className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/50"
                    />
                    <span className="text-xs font-medium text-slate-400 group-hover:text-white">{p.perfil_nombre}</span>
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 font-bold italic">Si no selecciona nada, aplica a todos.</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                  <UserIcon className="h-3.5 w-3.5 text-purple-400" /> Alcance por Usuario
                </Label>
                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {formData.usuarios.length} Seleccionados
                </div>
              </div>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-purple-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre o email..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all h-10"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 h-48 overflow-y-auto space-y-1 custom-scrollbar">
                {!formData.tenantId ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 opacity-50">
                    <UserIcon className="h-6 w-6" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Seleccione un tenant</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 italic text-[10px] uppercase font-bold tracking-widest">Sin resultados</div>
                ) : filteredUsers.map(u => (
                  <label key={u.usuario_email} className="flex items-center gap-3 p-2.5 hover:bg-slate-900 rounded-lg cursor-pointer transition-colors group">
                    <input 
                      type="checkbox" 
                      checked={formData.usuarios.includes(u.usuario_email)}
                      onChange={e => {
                        const next = e.target.checked 
                          ? [...formData.usuarios, u.usuario_email]
                          : formData.usuarios.filter(email => email !== u.usuario_email);
                        setFormData({...formData, usuarios: next});
                      }}
                      className="rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-purple-500/50"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">{u.usuario_nombre}</span>
                      <span className="text-[10px] text-slate-600 font-medium truncate italic">{u.usuario_email}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold gap-2 rounded-xl transition-all active:scale-95 py-6 uppercase tracking-widest text-xs disabled:opacity-70">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? "Protegiendo..." : (editingItem ? "Actualizar Regla" : "Activar Restricción")}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1 border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl h-12 uppercase tracking-widest text-xs transition-all active:scale-95"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title="¿Eliminar Restricción?" description="Esta acción desactivará la protección de este campo para todos los usuarios afectados." variant="dark" />
    </div>
  );
}
