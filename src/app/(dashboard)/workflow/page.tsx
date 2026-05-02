"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomModal } from "@/components/ui/dialog-custom";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { 
  Plus, Edit3, Trash2, CheckCircle2, Save, Search, 
  Activity, Boxes, GitBranch, Shield, Layout, Palette, Tag, Check, X,
  ArrowRightCircle, Settings2, Sparkles, Fingerprint, Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Hexagon, Loader2
} from "lucide-react";
import { getLoggedUserEmail } from "@/lib/auth-utils";
import { Badge } from "@/components/ui/badge";

export default function WorkflowPage() {
  const [activeTab, setActiveTab] = useState<"objetos" | "estados" | "config">("objetos");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const [estados, setEstados] = useState<any[]>([]);
  const [objetos, setObjetos] = useState<any[]>([]);
  const [perfiles, setPerfiles] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [selectedObjFilter, setSelectedObjFilter] = useState<string>("all");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [estadoForm, setEstadoForm] = useState({ nombre: "", color: "#10b981", estado: true });
  const [objetoForm, setObjetoForm] = useState({ nombre: "" });
  const [configForm, setConfigForm] = useState({
    objetoId: "", perfilId: "", estadoActualId: "", estadoSigId: "", esInicial: false, etiqueta: ""
  });

  const predefinedColors = [
    "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#6366f1", 
    "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e", "#64748b"
  ];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async (objId?: string) => {
    setLoading(true);
    try {
      const configUrl = objId && objId !== "all" ? `/api/workflow?objId=${objId}` : "/api/workflow";
      
      const [resEst, resObj, resPerf, resConf] = await Promise.all([
        fetch("/api/flujo-estados"),
        fetch("/api/objetos"),
        fetch("/api/admin/perfiles"),
        fetch(configUrl)
      ]);
      setEstados(await resEst.json());
      setObjetos(await resObj.json());
      setPerfiles(await resPerf.json());
      setConfigs(await resConf.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData(selectedObjFilter);
  }, [selectedObjFilter]);

  const openCreate = () => {
    setEditingItem(null);
    setEstadoForm({ nombre: "", color: "#10b981", estado: true });
    setObjetoForm({ nombre: "" });
    setConfigForm({ objetoId: "", perfilId: "", estadoActualId: "", estadoSigId: "", esInicial: false, etiqueta: "" });
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    if (activeTab === "estados") {
      setEstadoForm({ nombre: item.flu_est_nom, color: item.flu_est_color_hex, estado: item.flu_est_est });
    } else if (activeTab === "objetos") {
      setObjetoForm({ nombre: item.obj_nom });
    } else {
      setConfigForm({
        objetoId: item.flu_conf_obj_id.toString(),
        perfilId: item.flu_conf_perfil_cod.toString(),
        estadoActualId: item.flu_conf_id_estado_actual?.toString() || "",
        estadoSigId: item.flu_conf_id_estado_siguiente.toString(),
        esInicial: item.flu_conf_es_estado_inicial,
        etiqueta: item.flu_conf_etiqueta_accion || ""
      });
    }
    setIsModalOpen(true);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let url = "";
    let method = editingItem ? "PUT" : "POST";
    let body = {};

    if (activeTab === "estados") {
      url = editingItem ? `/api/flujo-estados/${editingItem.flu_est_id}` : "/api/flujo-estados";
      body = estadoForm;
    } else if (activeTab === "objetos") {
      url = editingItem ? `/api/objetos/${editingItem.obj_id}` : "/api/objetos";
      body = objetoForm;
    } else {
      url = editingItem ? `/api/workflow/${editingItem.flu_conf_id}` : "/api/workflow";
      body = configForm;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(url, {
        method,
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        setIsModalOpen(false);
        showToast(editingItem ? "Registro actualizado" : "Registro creado");
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Ocurrió un error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    let url = "";
    if (activeTab === "estados") url = `/api/flujo-estados/${itemToDelete.flu_est_id}`;
    else if (activeTab === "objetos") url = `/api/objetos/${itemToDelete.obj_id}`;
    else url = `/api/workflow/${itemToDelete.flu_conf_id}`;

    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Registro eliminado");
      fetchData();
    } else {
      const err = await res.json();
      alert(err.error || "No se pudo eliminar el registro");
    }
  };

  const currentData = activeTab === "objetos" ? objetos : activeTab === "estados" ? estados : configs;

  // Lógica de Paginación
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = currentData.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Resetear página al cambiar tab o filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedObjFilter]);

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#00a3e0]">
             Motor de Flujos
          </h1>
          <p className="text-[#64748b] text-sm mt-1">
             Administra los estados, objetos y reglas de transición del sistema.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-[#00a3e0] hover:bg-[#008bc0] text-white font-bold py-2 px-6 rounded-lg shadow-sm flex gap-2 h-[42px]">
          <Plus className="h-5 w-5" /> 
          <span>Nuevo {activeTab === "objetos" ? "Objeto" : activeTab === "estados" ? "Estado" : "Regla"}</span>
        </Button>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setActiveTab("objetos")} className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === "objetos" ? "border-[#00a3e0] text-[#00a3e0]" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
          Objetos
        </button>
        <button onClick={() => setActiveTab("estados")} className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === "estados" ? "border-[#00a3e0] text-[#00a3e0]" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
          Estados
        </button>
        <button onClick={() => setActiveTab("config")} className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === "config" ? "border-[#00a3e0] text-[#00a3e0]" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
          Configuración
        </button>
      </div>

      <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <h3 className="text-lg font-bold text-slate-800">
             {activeTab === "objetos" ? "Objetos Registrados" : activeTab === "estados" ? "Estados de Flujo" : "Matriz de Transiciones"}
           </h3>

           {activeTab === "config" && (
             <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
               <div className="flex items-center gap-2 px-2 border-r border-slate-200">
                 <Boxes className="h-4 w-4 text-[#00a3e0]" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Filtrar por Objeto</span>
               </div>
               <select 
                value={selectedObjFilter}
                onChange={(e) => setSelectedObjFilter(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-slate-600 outline-none pr-8 cursor-pointer focus:ring-0"
               >
                 <option value="all">TODOS LOS OBJETOS</option>
                 {objetos.map(o => (
                   <option key={o.obj_id} value={o.obj_id}>{o.obj_nom.toUpperCase()}</option>
                 ))}
               </select>
             </div>
           )}
        </div>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  {activeTab === "objetos" ? (
                    <>
                      <th className="px-6 py-4 w-20">ID</th>
                      <th className="px-6 py-4">NOMBRE DEL OBJETO</th>
                      <th className="px-6 py-4">USUARIO ALTA</th>
                    </>
                  ) : activeTab === "estados" ? (
                    <>
                      <th className="px-6 py-4 w-20">ID</th>
                      <th className="px-6 py-4">NOMBRE DEL ESTADO</th>
                      <th className="px-6 py-4 text-center">COLOR</th>
                      <th className="px-6 py-4 text-center">ESTADO</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4">OBJETO</th>
                      <th className="px-6 py-4">PERFIL</th>
                      <th className="px-6 py-4">ESTADO ORIGEN</th>
                      <th className="px-6 py-4 text-center">ACCIÓN</th>
                      <th className="px-6 py-4">ESTADO DESTINO</th>
                    </>
                  )}
                  <th className="px-6 py-4 text-center w-32">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                   <tr><td colSpan={10} className="px-6 py-12 text-center text-slate-400 italic">Cargando datos...</td></tr>
                ) : paginatedData.length === 0 ? (
                   <tr><td colSpan={10} className="px-6 py-12 text-center text-slate-400 italic">No hay registros disponibles.</td></tr>
                ) : paginatedData.map((item) => (
                  <tr key={activeTab === "objetos" ? item.obj_id : activeTab === "estados" ? item.flu_est_id : item.flu_conf_id} className="hover:bg-slate-50/50 transition-colors">
                    {activeTab === "objetos" ? (
                      <>
                        <td className="px-6 py-4 text-xs text-slate-400 font-medium">#{item.obj_id}</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                             <Hexagon className="h-4 w-4 text-[#00a3e0]" />
                             <span className="font-bold text-slate-700">{item.obj_nom}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <Badge variant="outline" className="bg-[#f1f5f9] text-[#475569] border-none font-bold text-[10px] px-3 py-1 flex gap-2 w-fit uppercase">
                              <Users className="h-3 w-3" /> {item.usuario_mod_nombre || item.usuario_alta_nombre}
                           </Badge>
                        </td>
                      </>
                    ) : activeTab === "estados" ? (
                      <>
                        <td className="px-6 py-4 text-xs text-slate-400 font-medium">#{item.flu_est_id}</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                             <Hexagon className="h-4 w-4 text-[#00a3e0]" />
                             <span className="font-bold text-slate-700">{item.flu_est_nom}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <div className="w-5 h-5 rounded-full mx-auto shadow-sm border border-slate-200" style={{ backgroundColor: item.flu_est_color_hex || "#333" }} />
                        </td>
                        <td className="px-6 py-4 text-center">
                           <Badge variant={item.flu_est_est ? "default" : "secondary"} className={item.flu_est_est ? "bg-emerald-500/10 text-emerald-600 border-none font-bold" : "font-bold"}>{item.flu_est_est ? "ACTIVO" : "INACTIVO"}</Badge>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                           <span className="font-bold text-slate-600 text-xs uppercase">{item.objeto?.obj_nom}</span>
                        </td>
                        <td className="px-6 py-4">
                           <Badge variant="outline" className="bg-[#ebf8ff] text-[#0070f3] border-none font-bold text-[10px] px-3 py-1 flex gap-2 w-fit uppercase">
                              <Shield className="h-3 w-3" /> {item.perfil?.perfil_nombre}
                           </Badge>
                        </td>
                        <td className="px-6 py-4">
                           {item.estado_actual ? (
                             <div className="flex items-center gap-2">
                               <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.estado_actual.flu_est_color_hex }} />
                               <span className="text-[11px] font-bold text-slate-500">{item.estado_actual.flu_est_nom}</span>
                             </div>
                           ) : (
                             <div className="flex items-center gap-2">
                               <Sparkles className="h-3 w-3 text-amber-500" />
                               <span className="text-[10px] text-amber-500 font-bold uppercase italic">Estado Inicial</span>
                             </div>
                           )}
                        </td>
                        <td className="px-6 py-4 text-center">
                           <Badge className="bg-[#00a3e0] text-white text-[9px] font-black tracking-widest px-3 py-1">{item.flu_conf_etiqueta_accion}</Badge>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                             <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.estado_sig.flu_est_color_hex }} />
                             <span className="text-[11px] font-bold text-slate-700">{item.estado_sig.flu_est_nom}</span>
                           </div>
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4">
                       <div className="flex justify-center gap-2">
                          <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 gap-2 border-slate-200 hover:bg-slate-50 px-3 font-bold text-xs text-slate-600"><Edit3 className="h-3.5 w-3.5" /> Editar</Button>
                          <Button onClick={() => {setItemToDelete(item); setIsConfirmOpen(true);}} variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {!loading && currentData.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">
                Mostrando <span className="text-slate-600 font-black">{startIndex + 1}</span> a <span className="text-slate-600 font-black">{Math.min(startIndex + itemsPerPage, currentData.length)}</span> de <span className="text-slate-600 font-black">{currentData.length}</span> registros
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => goToPage(1)} disabled={currentPage === 1} title="Primero"><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} title="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
                
                <div className="flex items-center gap-1 mx-2">
                  <Badge variant="secondary" className="h-8 w-8 flex items-center justify-center p-0 rounded-lg bg-[#00a3e0]/10 text-[#00a3e0] font-bold border-[#00a3e0]/20">
                    {currentPage}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-black uppercase px-1">de</span>
                  <span className="text-[10px] text-slate-400 font-black uppercase px-1">{totalPages || 1}</span>
                </div>

                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} title="Siguiente"><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} title="Último"><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`${editingItem ? 'Editar' : 'Nuevo'} ${activeTab === "estados" ? 'Estado' : activeTab === "objetos" ? 'Objeto' : 'Configuración de Flujo'}`}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === "estados" && (
            <div className="space-y-4">
               <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Hexagon className="h-3 w-3 text-[#00a3e0]" /> Nombre del Estado</Label>
                  <Input value={estadoForm.nombre} onChange={e => setEstadoForm({...estadoForm, nombre: e.target.value})} placeholder="Ej: Pendiente, En Ruta..." required autoFocus className="h-11 rounded-xl" />
               </div>
               
               <div className="space-y-3">
                  <Label className="flex items-center gap-2"><Palette className="h-3 w-3 text-[#00a3e0]" /> Paleta de Colores</Label>
                  <div className="grid grid-cols-5 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    {predefinedColors.map(c => (
                      <div 
                        key={c} 
                        onClick={() => setEstadoForm({...estadoForm, color: c})}
                        className={`h-10 w-full rounded-xl cursor-pointer transition-all border-2 ${estadoForm.color === c ? "border-[#00a3e0] scale-110 shadow-md" : "border-transparent hover:scale-105"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === "objetos" && (
            <div className="space-y-2">
               <Label className="flex items-center gap-2"><Boxes className="h-3 w-3 text-[#00a3e0]" /> Nombre de la Pantalla / Objeto</Label>
               <Input value={objetoForm.nombre} onChange={e => setObjetoForm({...objetoForm, nombre: e.target.value})} placeholder="Ej: Viajes, Móviles..." required autoFocus className="h-11 rounded-xl" />
            </div>
          )}

          {activeTab === "config" && (
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label className="flex items-center gap-2"><Boxes className="h-3 w-3 text-[#00a3e0]" /> Objeto</Label>
                     <select className="flex h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-[#00a3e0] outline-none" value={configForm.objetoId} onChange={e => setConfigForm({...configForm, objetoId: e.target.value})} required>
                        <option value="">Seleccione Objeto...</option>
                        {objetos.map(o => <option key={o.obj_id} value={o.obj_id}>{o.obj_nom}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <Label className="flex items-center gap-2"><Shield className="h-3 w-3 text-[#00a3e0]" /> Perfil Autorizado</Label>
                     <select className="flex h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-[#00a3e0] outline-none" value={configForm.perfilId} onChange={e => setConfigForm({...configForm, perfilId: e.target.value})} required>
                        <option value="">Seleccione Perfil...</option>
                        {perfiles.map(p => <option key={p.perfil_cod} value={p.perfil_cod}>{p.perfil_nombre}</option>)}
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label className="flex items-center gap-2"><GitBranch className="h-3 w-3 text-[#00a3e0]" /> Estado Origen (Actual)</Label>
                     <select className="flex h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-[#00a3e0] outline-none" value={configForm.estadoActualId} onChange={e => setConfigForm({...configForm, estadoActualId: e.target.value})}>
                        <option value="">SIN ORIGEN (ALTA)</option>
                        {estados.map(s => <option key={s.flu_est_id} value={s.flu_est_id}>{s.flu_est_nom}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <Label className="flex items-center gap-2"><GitBranch className="h-3 w-3 text-[#00a3e0]" /> Estado Destino (Siguiente)</Label>
                     <select className="flex h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-[#00a3e0] outline-none" value={configForm.estadoSigId} onChange={e => setConfigForm({...configForm, estadoSigId: e.target.value})} required>
                        <option value="">Seleccione Siguiente...</option>
                        {estados.map(s => <option key={s.flu_est_id} value={s.flu_est_id}>{s.flu_est_nom}</option>)}
                     </select>
                  </div>
               </div>

               <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Tag className="h-3 w-3 text-[#00a3e0]" /> Etiqueta del Botón (Acción)</Label>
                  <Input value={configForm.etiqueta} onChange={e => setConfigForm({...configForm, etiqueta: e.target.value})} placeholder="Ej: Aprobar, Despachar, Cancelar..." required className="h-11 rounded-xl" />
               </div>

               <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <input 
                    type="checkbox" 
                    id="esInicial"
                    checked={configForm.esInicial} 
                    onChange={e => setConfigForm({...configForm, esInicial: e.target.checked})}
                    className="h-5 w-5 rounded border-slate-300 text-[#00a3e0] focus:ring-[#00a3e0]"
                  />
                  <Label htmlFor="esInicial" className="font-bold text-slate-600 cursor-pointer">¿Es el Estado Inicial para el Alta?</Label>
               </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="h-12 px-8 rounded-xl font-bold border-slate-200 hover:bg-slate-50">Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="h-12 px-8 rounded-xl font-bold bg-[#00a3e0] hover:brightness-105 text-white shadow-lg shadow-[#00a3e0]/20 flex gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:scale-100">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? "Procesando..." : "Guardar Registro"}
            </Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleDelete} 
        title="¿Eliminar registro?" 
        message="Esta acción no se puede deshacer y podría afectar el flujo de negocio." 
      />

      {toast && (
        <div className="fixed bottom-8 right-8 z-[3000] animate-in slide-in-from-right-10 duration-500">
          <div className="bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold uppercase tracking-widest">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
