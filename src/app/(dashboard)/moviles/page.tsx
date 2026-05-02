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
  ShieldCheck, Box, Truck, CreditCard, Zap, Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFieldSecurity } from "@/hooks/useFieldSecurity";

type MovilTab = "marca" | "modelo" | "movil";

export default function MovilesPage() {
  const [activeTab, setActiveTab] = useState<MovilTab>("marca");
  
  const marcaSecurity = useFieldSecurity("MovilMarca");
  const modeloSecurity = useFieldSecurity("MovilModelo");
  const movilSecurity = useFieldSecurity("Movil");

  const security = activeTab === "marca" ? marcaSecurity : activeTab === "modelo" ? modeloSecurity : movilSecurity;
  const { isHidden, isReadOnly, loadingRestrictions } = security;

  const [data, setData] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [modelos, setModelos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
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
    chapa: "",
    marcaId: "",
    modeloId: "",
    catId: "",
    anho: "",
    tipo: "",
    capacidad: "",
    kmActual: "",
    vtoSeguro: "",
    vtoHabilitacion: "",
    estado: "A"
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
      const commonHeaders = {
        "x-tenant-id": tenantId,
        "x-user-email": user?.email || "",
        "x-user-profile": user?.perfil_cod?.toString() || ""
      };

      const res = await fetch(`/api/admin/moviles?type=${activeTab}`, { headers: commonHeaders });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
      setCurrentPage(1);

      // Cargar listas auxiliares
      const [rMarcas, rCategorias] = await Promise.all([
        fetch("/api/admin/moviles?type=marca", { headers: commonHeaders }),
        fetch("/api/movil-categorias", { headers: commonHeaders })
      ]);
      setMarcas(await rMarcas.json());
      setCategorias(await rCategorias.json());

      if (activeTab === "movil" || activeTab === "modelo") {
         const rModelos = await fetch("/api/admin/moviles?type=modelo", { headers: commonHeaders });
         setModelos(await rModelos.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const openCreate = () => {
    setEditingItem(null);
    setFormData({
      nombre: "", chapa: "", marcaId: "", modeloId: "", catId: "", anho: "",
      tipo: "", capacidad: "", kmActual: "", vtoSeguro: "",
      vtoHabilitacion: "", estado: "A"
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    if (activeTab === "marca") {
      setFormData({ ...formData, nombre: item.mov_mar_nombre || "", estado: item.mov_mar_estado });
    } else if (activeTab === "modelo") {
      setFormData({ ...formData, nombre: item.mov_mod_nombre || "", marcaId: item.mov_mod_marca_id.toString(), estado: item.mov_mod_estado });
    } else {
      setFormData({
        nombre: "",
        chapa: item.movil_chapa || "",
        marcaId: item.movil_marca_id?.toString() || "",
        modeloId: item.movil_modelo_id?.toString() || "",
        catId: item.movil_cat_id?.toString() || "",
        anho: item.movil_anho?.toString() || "",
        tipo: item.movil_tipo || "",
        capacidad: item.movil_capacidad_kg?.toString() || "",
        kmActual: item.movil_km_actual?.toString() || "",
        vtoSeguro: item.movil_vto_seguro ? item.movil_vto_seguro.split('T')[0] : "",
        vtoHabilitacion: item.movil_vto_habilitacion ? item.movil_vto_habilitacion.split('T')[0] : "",
        estado: item.movil_estado
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const id = activeTab === "marca" ? editingItem?.mov_mar_id : activeTab === "modelo" ? editingItem?.mov_mod_id : editingItem?.movil_id;
      const method = editingItem ? "PUT" : "POST";
      const url = editingItem ? `/api/admin/moviles/${id}` : "/api/admin/moviles";

      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const tenantId = user?.tenantId || "public";
      const usuarioEmail = user?.email || "";

      const res = await fetch(url, {
        method,
        body: JSON.stringify({ type: activeTab, data: { ...formData, usuario: usuarioEmail } }),
        headers: { 
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-email": usuarioEmail,
          "x-user-profile": user?.perfil_cod?.toString() || ""
        }
      });

      if (res.ok) {
        setIsModalOpen(false);
        showToast(editingItem ? "Registro actualizado" : "Registro creado");
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
    const id = activeTab === "marca" ? itemToDelete.mov_mar_id : activeTab === "modelo" ? itemToDelete.mov_mod_id : itemToDelete.movil_id;
    
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const tenantId = user?.tenantId || "public";

    const res = await fetch(`/api/admin/moviles/${id}?type=${activeTab}`, { 
      method: "DELETE",
      headers: {
        "x-tenant-id": tenantId,
        "x-user-email": user?.email || "",
        "x-user-profile": user?.perfil_cod?.toString() || ""
      }
    });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Registro eliminado");
      fetchData();
    } else {
       const err = await res.json();
       showToast(err.error || "No se pudo eliminar");
    }
  };

  const filteredData = data.filter(item => {
    const searchStr = (
      item.mov_mar_nombre || 
      item.mov_mod_nombre || 
      item.movil_chapa || 
      item.movil_tipo || ""
    ).toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const tabs = [
    { id: "marca", label: "Marcas", icon: ShieldCheck },
    { id: "modelo", label: "Modelos", icon: Box },
    { id: "movil", label: "Móviles", icon: Truck }
  ] as const;

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
          <h1 className="text-3xl font-bold tracking-tight text-accent">Gestión de Flota</h1>
          <p className="text-muted mt-1 font-medium italic">Administración de vehículos, marcas y modelos operativos.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold hover:brightness-105 h-11 px-6 rounded-xl shadow-lg shadow-accent/20 transition-all">
          <Plus className="h-4 w-4 mr-2 stroke-[3]" /> {
            activeTab === 'marca' ? 'Nueva Marca' : 
            activeTab === 'modelo' ? 'Nuevo Modelo' : 
            'Nuevo Móvil'
          }
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100/50 rounded-xl w-fit border border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-[13px] transition-all ${
              activeTab === tab.id ? "bg-white text-accent shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="bg-card border-none shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
           <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-slate-700">Registros Activos</CardTitle>
                <CardDescription className="text-xs">Control de flota y especificaciones técnicas.</CardDescription>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                <Input placeholder="Buscar..." className="h-9 border-slate-200 bg-white w-64 pl-9 text-sm rounded-xl focus:ring-accent" value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] tracking-tight text-slate-400 font-bold uppercase">
                  <th className="px-8 py-4 w-24 text-center">ID</th>
                  <th className="px-8 py-4">Descripción / Detalle</th>
                  {activeTab === "movil" && <th className="px-8 py-4">Chapa / Técnica</th>}
                  <th className="px-8 py-4 text-center">Estado</th>
                  <th className="px-8 py-4">Última Modificación</th>
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-8 py-10 text-center text-slate-400 italic">Cargando catálogo...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={6} className="px-8 py-10 text-center text-slate-400 italic">No hay registros disponibles.</td></tr>
                ) : currentItems.map((item) => {
                  const id = item.mov_mar_id || item.mov_mod_id || item.movil_id;
                  const estado = item.mov_mar_estado || item.mov_mod_estado || item.movil_estado;
                  
                  return (
                    <tr key={`${activeTab}-${id}`} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-8 py-4 font-mono text-[11px] text-accent font-black text-center">#{id}</td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-accent/5 text-accent">
                            {activeTab === "marca" ? <ShieldCheck className="h-4 w-4" /> : activeTab === "modelo" ? <Box className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-700 text-sm">
                              {activeTab === "marca" ? (!isHidden("mov_mar_nombre") && item.mov_mar_nombre) : 
                               activeTab === "modelo" ? (!isHidden("mov_mod_nombre") && item.mov_mod_nombre) : 
                               (`${item.marca?.mov_mar_nombre} ${item.modelo?.mov_mod_nombre}`)}
                            </p>
                            {activeTab === "modelo" && !isHidden("mov_mod_marca_id") && <p className="text-[10px] text-muted font-medium uppercase tracking-tighter">Marca: {item.marca?.mov_mar_nombre}</p>}
                            {activeTab === "movil" && (
                              <div className="flex gap-2">
                                {!isHidden("movil_tipo") && !isHidden("movil_anho") && <p className="text-[10px] text-muted font-medium uppercase tracking-tighter">{item.movil_tipo} - Año {item.movil_anho}</p>}
                                {item.categoria && !isHidden("movil_cat_id") && <Badge variant="outline" className="text-[9px] h-3.5 bg-slate-100 border-slate-200 text-slate-500 font-bold">{item.categoria.mov_cat_dsc}</Badge>}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      {activeTab === "movil" && (
                        <td className="px-8 py-4">
                           <div className="space-y-1">
                              {!isHidden("movil_chapa") && (
                                <div className="flex items-center gap-2 font-mono text-xs font-black text-slate-600 bg-slate-100 w-fit px-2 py-0.5 rounded border border-slate-200">
                                  <CreditCard className="h-3 w-3" /> {item.movil_chapa}
                                </div>
                              )}
                              {!isHidden("movil_km_actual") && (
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                  <Zap className="h-3 w-3" /> {item.movil_km_actual?.toLocaleString() || 0} KM
                                </div>
                              )}
                              {!isHidden("movil_capacidad_kg") && (
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                  <Truck className="h-3 w-3 text-slate-300" /> {item.movil_capacidad_kg ? Number(item.movil_capacidad_kg).toLocaleString() : 0} KG
                                </div>
                              )}
                           </div>
                        </td>
                      )}
                      <td className="px-8 py-4 text-center">
                        <Badge variant="outline" className={`font-black uppercase text-[9px] tracking-tighter ${estado === 'A' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                          {estado === 'A' ? 'ACTIVO' : 'INACTIVO'}
                        </Badge>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col text-[10px]">
                          <span className="text-slate-500 font-bold uppercase">{item.usuario_mod_nombre || item.usuario_alta_nombre}</span>
                          <span className="text-slate-400 italic">
                            {new Date(
                              item.mov_mar_fecha_mod || item.mov_mar_fecha_alta || 
                              item.mov_mod_fecha_mod || item.mov_mod_fecha_alta || 
                              item.movil_fecha_mod || item.movil_fecha_alta
                            ).toLocaleString()}
                          </span>
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
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/20">
             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total: {filteredData.length} registros</span>
             <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl font-bold" onClick={() => setCurrentPage(Math.max(1, currentPage-1))} disabled={currentPage===1}>Anterior</Button>
                <div className="flex items-center px-6 bg-white border border-slate-200 rounded-xl text-xs font-black text-accent shadow-inner">{currentPage} / {totalPages || 1}</div>
                <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl font-bold" onClick={() => setCurrentPage(Math.min(totalPages, currentPage+1))} disabled={currentPage===totalPages || totalPages === 0}>Siguiente</Button>
             </div>
          </div>
        </CardContent>
      </Card>

      <CustomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`${editingItem ? 'Editar' : 'Nuevo/a'} ${tabs.find(t=>t.id===activeTab)?.label.slice(0,-1)}`}
        className="max-w-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-white/50 backdrop-blur-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {activeTab === "marca" && (
            !isHidden("mov_mar_nombre") && (
              <div className="space-y-2">
                <Label>Nombre de la Marca</Label>
                <Input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Mercedes Benz, Scania..." className="h-12 border-slate-200 text-slate-950 font-medium bg-white shadow-sm" required autoFocus disabled={isReadOnly("mov_mar_nombre")} />
              </div>
            )
          )}

          {activeTab === "modelo" && (
            <>
              {!isHidden("mov_mod_marca_id") && (
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <select className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 font-medium focus:ring-2 focus:ring-accent outline-none shadow-sm" value={formData.marcaId} onChange={e => setFormData({...formData, marcaId: e.target.value})} required autoFocus disabled={isReadOnly("mov_mod_marca_id")}>
                    <option value="">Seleccione marca...</option>
                    {marcas.map(m => <option key={m.mov_mar_id} value={m.mov_mar_id}>{m.mov_mar_nombre}</option>)}
                  </select>
                </div>
              )}
              {!isHidden("mov_mod_nombre") && (
                <div className="space-y-2">
                  <Label>Nombre del Modelo</Label>
                  <Input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Sprinter 515, Actros..." className="h-12 border-slate-200 text-slate-950 font-medium bg-white shadow-sm" required disabled={isReadOnly("mov_mod_nombre")} />
                </div>
              )}
            </>
          )}

          {activeTab === "movil" && (
            <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto px-1">
              {!isHidden("movil_chapa") && (
                <div className="space-y-2 col-span-2">
                   <Label>N° de Chapa (Matrícula)</Label>
                   <Input 
                     value={formData.chapa} 
                     onChange={e => setFormData({...formData, chapa: e.target.value.toUpperCase()})} 
                     placeholder="Ej: ABC 123" 
                     className="h-12 border-slate-200 text-slate-950 font-medium bg-white shadow-sm uppercase font-mono"
                     required 
                     autoFocus
                     disabled={isReadOnly("movil_chapa")}
                   />
                </div>
              )}
              {!isHidden("movil_marca_id") && (
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <select className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 font-medium focus:ring-2 focus:ring-accent outline-none shadow-sm" value={formData.marcaId} onChange={e => {setFormData({...formData, marcaId: e.target.value, modeloId: ""});}} required disabled={isReadOnly("movil_marca_id")}>
                    <option value="">Marca...</option>
                    {marcas.map(m => <option key={m.mov_mar_id} value={m.mov_mar_id}>{m.mov_mar_nombre}</option>)}
                  </select>
                </div>
              )}
              {!isHidden("movil_modelo_id") && (
                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <select className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 font-medium focus:ring-2 focus:ring-accent outline-none shadow-sm" value={formData.modeloId} onChange={e => setFormData({...formData, modeloId: e.target.value})} required disabled={!formData.marcaId || isReadOnly("movil_modelo_id")}>
                    <option value="">Modelo...</option>
                    {modelos.filter(m => m.mov_mod_marca_id === parseInt(formData.marcaId)).map(m => <option key={m.mov_mod_id} value={m.mov_mod_id}>{m.mov_mod_nombre}</option>)}
                  </select>
                </div>
              )}
              {!isHidden("movil_cat_id") && (
                <div className="space-y-2 col-span-2">
                  <Label>Categoría de Móvil</Label>
                  <select className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 font-medium focus:ring-2 focus:ring-accent outline-none shadow-sm" value={formData.catId} onChange={e => setFormData({...formData, catId: e.target.value})} required disabled={isReadOnly("movil_cat_id")}>
                    <option value="">Seleccione categoría...</option>
                    {categorias.map(c => <option key={c.mov_cat_id} value={c.mov_cat_id}>{c.mov_cat_dsc}</option>)}
                  </select>
                </div>
              )}
              {!isHidden("movil_tipo") && (
                <div className="space-y-2">
                  <Label>Tipo de Vehículo</Label>
                  <Input value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} placeholder="Ej: Camión, Furgón..." className="h-12 border-slate-200 text-slate-950 font-medium bg-white shadow-sm" disabled={isReadOnly("movil_tipo")} />
                </div>
              )}
              {!isHidden("movil_anho") && (
                <div className="space-y-2">
                  <Label>Año</Label>
                  <Input type="number" value={formData.anho} onChange={e => setFormData({...formData, anho: e.target.value})} placeholder="2023" className="h-12 border-slate-200 text-slate-950 font-medium bg-white shadow-sm" disabled={isReadOnly("movil_anho")} />
                </div>
              )}
              {!isHidden("movil_capacidad_kg") && (
                <div className="space-y-2">
                  <Label className="flex justify-between">Capacidad (Kg) <span className="text-[10px] text-accent font-black">{formData.capacidad ? Number(formData.capacidad).toLocaleString('es-PY') : 0} KG</span></Label>
                  <Input type="number" step="0.01" value={formData.capacidad} onChange={e => setFormData({...formData, capacidad: e.target.value})} placeholder="5000.00" className="h-12 border-slate-200 text-slate-950 font-medium bg-white shadow-sm" disabled={isReadOnly("movil_capacidad_kg")} />
                </div>
              )}
              {!isHidden("movil_km_actual") && (
                <div className="space-y-2">
                  <Label className="flex justify-between">Km Actual <span className="text-[10px] text-accent font-black">{formData.kmActual ? Number(formData.kmActual).toLocaleString('es-PY') : 0} KM</span></Label>
                  <Input type="number" value={formData.kmActual} onChange={e => setFormData({...formData, kmActual: e.target.value})} placeholder="0" className="h-12 border-slate-200 text-slate-950 font-medium bg-white shadow-sm" disabled={isReadOnly("movil_km_actual")} />
                </div>
              )}
              {!isHidden("movil_vto_seguro") && (
                <div className="space-y-2">
                  <Label>Vto. Seguro</Label>
                  <Input type="date" value={formData.vtoSeguro} onChange={e => setFormData({...formData, vtoSeguro: e.target.value})} className="h-12 border-slate-200 text-slate-950 font-medium bg-white shadow-sm" disabled={isReadOnly("movil_vto_seguro")} />
                </div>
              )}
              {!isHidden("movil_vto_habilitacion") && (
                <div className="space-y-2">
                  <Label>Vto. Habilitación</Label>
                  <Input type="date" value={formData.vtoHabilitacion} onChange={e => setFormData({...formData, vtoHabilitacion: e.target.value})} className="h-12 border-slate-200 text-slate-950 font-medium bg-white shadow-sm" disabled={isReadOnly("movil_vto_habilitacion")} />
                </div>
              )}
            </div>
          )}

          {!isHidden(activeTab === "marca" ? "mov_mar_estado" : activeTab === "modelo" ? "mov_mod_estado" : "movil_estado") && (
            <div className="space-y-2">
              <Label>Estado</Label>
              <select 
                className={`flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 font-medium focus:ring-2 focus:ring-accent outline-none shadow-sm ${!editingItem ? 'bg-slate-50 opacity-70 cursor-not-allowed' : ''}`} 
                value={formData.estado} 
                onChange={e => setFormData({...formData, estado: e.target.value})}
                disabled={!editingItem || isReadOnly(activeTab === "marca" ? "mov_mar_estado" : activeTab === "modelo" ? "mov_mod_estado" : "movil_estado")}
              >
                <option value="A">Activo</option>
                <option value="I">Inactivo</option>
              </select>
              {!editingItem && <p className="text-[10px] text-muted italic font-medium">Los nuevos registros se crean en estado Activo por defecto.</p>}
            </div>
          )}

          <div className="flex gap-4 pt-6">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-accent text-white font-bold h-12 rounded-2xl shadow-lg shadow-accent/20 flex gap-2 uppercase tracking-tighter transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:scale-100">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? "Guardando..." : "Guardar Registro"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-tighter text-slate-500">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title={`¿Eliminar ${tabs.find(t=>t.id===activeTab)?.label.slice(0,-1)}?`} description="Esta acción es permanente y puede fallar si el registro tiene dependencias activas (ej: modelos vinculados a esta marca)." />
    </div>
  );
}
