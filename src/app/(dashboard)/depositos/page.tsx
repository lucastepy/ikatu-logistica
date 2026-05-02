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
  ChevronLeft, ChevronRight, Warehouse, Globe, Map as MapIcon, Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFieldSecurity } from "@/hooks/useFieldSecurity";
import dynamic from "next/dynamic";

const PointMap = dynamic(() => import("@/components/maps/point-map"), { ssr: false });

interface Deposito {
  deposito_id: number;
  deposito_nombre: string;
  deposito_dep_tipo?: number;
  deposito_direccion?: string;
  deposito_cap_vol_m3?: number;
  deposito_estado: boolean;
  deposito_depa?: number;
  deposito_dis?: number;
  deposito_ciu?: number;
  deposito_bar?: number;
  lat?: number;
  lng?: number;
  tipo?: {
    tipo_dep_dsc: string;
  };
}

export default function DepositosPage() {
  const { isHidden, isReadOnly, loadingRestrictions } = useFieldSecurity("Deposito");
  const [data, setData] = useState<Deposito[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [deps, setDeps] = useState<any[]>([]);
  const [distritos, setDistritos] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [barrios, setBarrios] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Deposito | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    nombre: "",
    tipoId: "",
    direccion: "",
    cap: "0",
    estado: true,
    depa: "",
    dis: "",
    ciu: "",
    bar: "",
    lat: -25.30066, // Coordenadas por defecto (Paraguay)
    lng: -57.63591
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const formatNumber = (val: string | number) => {
    if (!val && val !== 0) return "";
    const cleaned = val.toString().replace(/\D/g, "");
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseNumber = (val: string) => {
    return val.replace(/\./g, "");
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

      const res = await fetch("/api/admin/depositos", { headers: commonHeaders });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
      
      const rTipos = await fetch("/api/admin/tipo-depositos", { headers: commonHeaders });
      setTipos(await rTipos.json());
      
      const rDeps = await fetch("/api/admin/config-locations?type=dep", { headers: commonHeaders });
      setDeps(await rDeps.json());
      const rDis = await fetch("/api/admin/config-locations?type=dis", { headers: commonHeaders });
      setDistritos(await rDis.json());
      const rCiu = await fetch("/api/admin/config-locations?type=ciu", { headers: commonHeaders });
      setCiudades(await rCiu.json());
      const rBar = await fetch("/api/admin/config-locations?type=bar", { headers: commonHeaders });
      setBarrios(await rBar.json());

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
    setFormData({ 
      nombre: "", tipoId: "", direccion: "", cap: "0", estado: true, 
      depa: "", dis: "", ciu: "", bar: "",
      lat: -25.30066, lng: -57.63591
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: Deposito) => {
    setEditingItem(item);
    setFormData({ 
      nombre: item.deposito_nombre || "", 
      tipoId: item.deposito_dep_tipo?.toString() || "", 
      direccion: item.deposito_direccion || "", 
      cap: item.deposito_cap_vol_m3?.toString() || "0", 
      estado: item.deposito_estado,
      depa: item.deposito_depa?.toString() || "",
      dis: item.deposito_dis?.toString() || "",
      ciu: item.deposito_ciu?.toString() || "",
      bar: item.deposito_bar?.toString() || "",
      lat: item.lat || -25.30066,
      lng: item.lng || -57.63591
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

      const res = await fetch("/api/admin/depositos", {
        method: "POST",
        body: JSON.stringify({ 
          ...formData, 
          cap: parseNumber(formData.cap),
          id: editingItem?.deposito_id, 
          isEdit: !!editingItem 
        }),
        headers: { 
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-email": user?.email || "",
          "x-user-profile": user?.perfil_cod?.toString() || ""
        }
      });

      if (res.ok) {
        setIsModalOpen(false);
        showToast(editingItem ? "Depósito actualizado" : "Depósito creado");
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

  const onConfirmDelete = async () => {
    if (!itemToDelete) return;
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const tenantId = user?.tenantId || "public";

    const res = await fetch(`/api/admin/depositos?id=${itemToDelete}`, { 
      method: "DELETE",
      headers: {
        "x-tenant-id": tenantId,
        "x-user-email": user?.email || "",
        "x-user-profile": user?.perfil_cod?.toString() || ""
      }
    });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Depósito eliminado");
      fetchData();
    }
  };

  const filteredData = data.filter(item => 
    (item.deposito_nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.deposito_direccion || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

  if (loadingRestrictions && loading) {
    return <div className="h-screen flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Sincronizando Seguridad...</div>;
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 relative bg-[#f8fafc] min-h-screen">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-8 duration-300">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/50 backdrop-blur-xl">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="font-bold text-sm tracking-tight">{toast}</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent flex items-center gap-3">
             <Warehouse className="h-8 w-8" /> Gestión de Depósitos
          </h1>
          <p className="text-muted mt-1 font-medium italic">Control centralizado de almacenes y ubicaciones físicas.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-accent/20 hover:brightness-105 transition-all flex gap-2">
          <Plus className="h-4 w-4 stroke-[3]" /> Registrar Depósito
        </Button>
      </div>

      <Card className="bg-white border-none shadow-[0_20px_50px_rgba(0,163,224,0.12)] shadow-2xl rounded-2xl overflow-hidden ring-1 ring-slate-100/50">
        <CardHeader className="bg-white border-b border-slate-100 p-6 space-y-4">
           <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-slate-700">Depósitos Registrados</CardTitle>
                <CardDescription className="text-xs">Monitorea la capacidad y ubicación de tus almacenes.</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input placeholder="Buscar por nombre o dirección..." className="h-9 border-slate-200 bg-white w-80 pl-9 text-sm focus-visible:ring-accent" value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-widest text-slate-400 font-black">
                  {!isHidden("deposito_id") && <th className="px-8 py-4 w-20 text-center">ID</th>}
                  <th className="px-8 py-4">Información del Almacén</th>
                  <th className="px-8 py-4">Tipo / Capacidad</th>
                  <th className="px-8 py-4 text-center">Geo</th>
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-400 italic">Analizando registros de almacén...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-400 italic">No hay depósitos registrados.</td></tr>
                ) : currentItems.map((item) => (
                  <tr key={item.deposito_id} className="hover:bg-slate-50/30 transition-colors group">
                    {!isHidden("deposito_id") && <td className="px-8 py-4 font-mono text-[11px] text-accent font-bold text-center">#{item.deposito_id}</td>}
                    <td className="px-8 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           {!isHidden("deposito_nombre") && <span className="font-bold text-slate-700 text-sm leading-none">{item.deposito_nombre}</span>}
                           {!isHidden("deposito_estado") && (
                             <Badge className={`text-[9px] font-black tracking-tight border-none ${item.deposito_estado ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                               {item.deposito_estado ? "ACTIVO" : "INACTIVO"}
                             </Badge>
                           )}
                        </div>
                        {!isHidden("deposito_direccion") && <p className="text-[11px] text-slate-400 line-clamp-1">{item.deposito_direccion}</p>}
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="space-y-1">
                        {!isHidden("deposito_dep_tipo") && (
                          <Badge variant="outline" className="text-[10px] uppercase font-bold border-slate-200 text-slate-500 bg-white">
                            {item.tipo?.tipo_dep_dsc || "Sin Tipo"}
                          </Badge>
                        )}
                        {!isHidden("deposito_cap_vol_m3") && (
                          <p className="text-[11px] font-bold text-accent">
                            {new Intl.NumberFormat('de-DE').format(Number(item.deposito_cap_vol_m3))} m³ capacidad
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center">
                       {(item.lat && item.lng && !isHidden("lat") && !isHidden("lng")) ? (
                          <div className="flex justify-center" title={`${item.lat}, ${item.lng}`}>
                             <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center">
                                <Globe className="h-3.5 w-3.5 text-emerald-600" />
                             </div>
                          </div>
                       ) : (
                          <span className="text-[10px] text-slate-300 italic">Sin Geo</span>
                       )}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(item)} className="h-8 flex items-center gap-2 border border-slate-200 hover:bg-slate-50 transition-all px-3 font-bold text-xs shadow-sm text-slate-600 rounded-lg">
                          <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" /> Editar
                        </button>
                        <button onClick={() => {setItemToDelete(item.deposito_id); setIsConfirmOpen(true);}} className="h-8 w-8 flex items-center justify-center text-red-500 hover:bg-red-50 transition-all rounded-lg">
                          <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && (
            <div className="flex items-center justify-between px-8 py-5 bg-slate-50/30 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                Total: <span className="text-slate-700">{filteredData.length}</span> depósitos registrados
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => setCurrentPage(Math.max(1, currentPage-1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <div className="px-4 h-8 flex items-center bg-white border border-slate-200 rounded-lg text-xs font-bold text-accent">
                   {currentPage} <span className="mx-1 text-slate-300">/</span> {totalPages || 1}
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => setCurrentPage(Math.min(totalPages, currentPage+1))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? "Editar Depósito" : "Nuevo Depósito"}
        className="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 pt-2 h-[80vh] overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
               {!isHidden("deposito_nombre") && (
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Nombre del Almacén</Label>
                    <Input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="h-10 rounded-lg border-slate-200 text-slate-950 font-medium bg-white shadow-sm" required disabled={isReadOnly("deposito_nombre")} />
                 </div>
               )}
               {!isHidden("deposito_dep_tipo") && (
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Tipo de Depósito</Label>
                    <select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 font-medium outline-none" value={formData.tipoId} onChange={e => setFormData({...formData, tipoId: e.target.value})} required disabled={isReadOnly("deposito_dep_tipo")}>
                       <option value="">Seleccione...</option>
                       {tipos.map(t => <option key={t.tipo_dep_id} value={t.tipo_dep_id}>{t.tipo_dep_dsc}</option>)}
                    </select>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-2 gap-4">
               {!isHidden("deposito_depa") && (
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Departamento</Label>
                    <select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 font-medium" value={formData.depa} onChange={e => setFormData({...formData, depa: e.target.value, dis:"", ciu:"", bar:""})} required disabled={isReadOnly("deposito_depa")}>
                       <option value="">Seleccione...</option>
                       {deps.map(d => <option key={d.dep_cod} value={d.dep_cod}>{d.dep_dsc}</option>)}
                    </select>
                 </div>
               )}
               {!isHidden("deposito_dis") && (
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Distrito</Label>
                    <select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 font-medium" value={formData.dis} onChange={e => setFormData({...formData, dis: e.target.value, ciu:"", bar:""})} disabled={!formData.depa || isReadOnly("deposito_dis")} required>
                       <option value="">Seleccione...</option>
                       {distritos.filter(d => d.dis_dep_cod === parseInt(formData.depa)).map(d => <option key={d.dis_cod} value={d.dis_cod}>{d.dis_dsc}</option>)}
                    </select>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-2 gap-4">
               {!isHidden("deposito_ciu") && (
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Ciudad</Label>
                    <select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 font-medium" value={formData.ciu} onChange={e => setFormData({...formData, ciu: e.target.value, bar:""})} disabled={!formData.dis || isReadOnly("deposito_ciu")} required>
                       <option value="">Seleccione...</option>
                       {ciudades.filter(c => c.ciu_dep_cod === parseInt(formData.depa) && c.ciu_dis_cod === parseInt(formData.dis)).map(c => <option key={c.ciu_cod} value={c.ciu_cod}>{c.ciu_dsc}</option>)}
                    </select>
                 </div>
               )}
               {!isHidden("deposito_bar") && (
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Barrio</Label>
                    <select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 font-medium" value={formData.bar} onChange={e => setFormData({...formData, bar: e.target.value})} disabled={!formData.ciu || isReadOnly("deposito_bar")}>
                       <option value="">Seleccione...</option>
                       {barrios.filter(b => b.bar_dep_cod === parseInt(formData.depa) && b.bar_dis_cod === parseInt(formData.dis) && b.bar_ciu_cod === parseInt(formData.ciu)).map(b => <option key={b.bar_cod} value={b.bar_cod}>{b.bar_dsc}</option>)}
                    </select>
                 </div>
               )}
            </div>

            {!isHidden("deposito_direccion") && (
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Dirección Física</Label>
                 <Input value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="h-10 rounded-lg border-slate-200 text-slate-950 font-medium bg-white shadow-sm" placeholder="Ej: Avda. Principal c/ 10 de Agosto" disabled={isReadOnly("deposito_direccion")} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
               {!isHidden("deposito_cap_vol_m3") && (
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Capacidad (m³)</Label>
                    <Input 
                      type="text" 
                      value={formatNumber(formData.cap)} 
                      onChange={e => setFormData({...formData, cap: parseNumber(e.target.value)})} 
                      className="h-10 rounded-lg border-slate-200 text-slate-950 font-medium bg-white shadow-sm" 
                      disabled={isReadOnly("deposito_cap_vol_m3")}
                    />
                 </div>
               )}
               {!isHidden("deposito_estado") && (
                 <div className="flex flex-col justify-end">
                    <div className="h-10 flex items-center justify-between px-4 bg-slate-50 border border-slate-100 rounded-lg">
                       <Label className="text-xs font-bold text-slate-600">Almacén Activo</Label>
                       <input type="checkbox" checked={formData.estado} onChange={e => setFormData({...formData, estado: e.target.checked})} className="h-4 w-4 accent-accent" disabled={isReadOnly("deposito_estado")} />
                    </div>
                 </div>
               )}
            </div>

            {/* Selector de Mapa */}
            {(!isHidden("lat") || !isHidden("lng")) && (
              <div className="space-y-2 pt-2">
                 <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <MapIcon className="h-3 w-3 text-accent" /> Ubicación en el Mapa
                 </Label>
                 <div className="h-[250px] rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 relative group">
                    <PointMap 
                      lat={formData.lat} 
                      lng={formData.lng} 
                      onChange={(lat, lng) => setFormData({...formData, lat, lng})} 
                      readOnly={isReadOnly("lat") || isReadOnly("lng")}
                    />
                    <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex gap-3 text-[10px] font-bold text-slate-500">
                       <span>LAT: <span className="text-accent">{formData.lat.toFixed(6)}</span></span>
                       <span>LNG: <span className="text-accent">{formData.lng.toFixed(6)}</span></span>
                    </div>
                 </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-100 mt-auto">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-accent text-white font-bold h-12 rounded-xl shadow-lg shadow-accent/20 gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:scale-100">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? "Guardando..." : (editingItem ? "Actualizar Almacén" : "Guardar Registro")}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title="¿Eliminar Depósito?" description="Esta acción es irreversible y eliminará el almacén de todos los registros operativos." />
    </div>
  );
}
