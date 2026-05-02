"use client";

import { useFieldSecurity } from "@/hooks/useFieldSecurity";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomModal } from "@/components/ui/dialog-custom";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { 
  Plus, Edit, Trash2, Save, MapPin, Truck, Users, Calendar, 
  CreditCard, Package, Navigation, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Hexagon, Route, Map as MapIcon,
  Search, Info, AlertTriangle, CheckCircle2, Clock, UserPlus, History as HistoryIcon, ArrowRight, Shield
} from "lucide-react";
import { getLoggedUserEmail } from "@/lib/auth-utils";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";

const PointMap = dynamic(() => import("@/components/maps/PointMap"), { ssr: false });
const TripMap = dynamic(() => import("@/components/maps/TripMap"), { ssr: false });

const StatusTransition = ({ viaId, estadoActual, estadoActualNombre, onChanged }: { viaId: number, estadoActual: string, estadoActualNombre: string, onChanged: () => void }) => {
  const [transiciones, setTransiciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const usuario = getLoggedUserEmail();
    console.log(`[StatusTransition] Fetching for viaId=${viaId}, user=${usuario}`);
    fetch(`/api/viajes/cambiar-estado?viaId=${viaId}&usuario=${usuario}&t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        console.log(`[StatusTransition] Received data:`, data);
        if (Array.isArray(data)) {
          setTransiciones(data);
        } else if (data && data.transiciones) {
          setTransiciones(data.transiciones);
        } else {
          setTransiciones([]);
        }
      })
      .catch(err => console.error("[StatusTransition] Fetch error:", err));
  }, [viaId, estadoActual]);

  const handleAction = async (nuevoEstadoId: number) => {
    setLoading(true);
    try {
      let lat = null, lng = null;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { 
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0 
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (e) { 
        console.warn("No se pudo obtener la ubicación:", e); 
      }

      const usuario = getLoggedUserEmail();
      const res = await fetch("/api/viajes/cambiar-estado", {
        method: "POST",
        body: JSON.stringify({ viaId, nuevoEstadoId, lat, lng, usuario }),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) onChanged();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Badge className={`
        ${estadoActualNombre === 'PROGRAMADO' ? 'bg-blue-500/10 text-blue-600' : ''}
        ${estadoActualNombre === 'EN CAMINO' ? 'bg-amber-500/10 text-amber-600' : ''}
        ${estadoActualNombre === 'ENTREGADO' ? 'bg-emerald-500/10 text-emerald-600' : ''}
        ${estadoActualNombre === 'DEMORADO' ? 'bg-red-500/10 text-red-600' : ''}
        border-none font-bold text-[10px] px-3 py-1
      `}>
        {estadoActualNombre || 'SIN ESTADO'}
      </Badge>
      
      {transiciones.length > 0 && (
        <div className="flex gap-2 flex-wrap justify-center mt-1">
          {transiciones.map(t => (
            <div key={t.id} className="relative group">
              <button
                disabled={loading || !t.canExecute}
                onClick={() => handleAction(t.estadoSiguienteId)}
                className={`
                  flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider 
                  px-3 py-1 rounded-full transition-all shadow-sm border
                  ${t.canExecute 
                    ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:shadow-md active:scale-95" 
                    : "bg-slate-100/50 border-slate-200/60 text-slate-400 cursor-not-allowed"
                  }
                `}
              >
                <div className={`h-1.5 w-1.5 rounded-full ${t.canExecute ? "bg-[#00a3e0]" : "bg-slate-300"}`} />
                {t.accion}
              </button>

              {!t.canExecute && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-[100] scale-90 group-hover:scale-100 transform origin-left">
                   <div className="flex items-center">
                     <div className="w-2 h-2 bg-slate-800 rotate-45 -mr-1 border-l border-b border-white/5" />
                     <div className="bg-slate-800/95 backdrop-blur-sm text-white text-[10px] px-3 py-2 rounded-xl whitespace-nowrap shadow-2xl border border-white/10 flex flex-col items-start gap-0.5">
                        <span className="text-slate-400 font-medium">ACCESO RESTRINGIDO</span>
                        <span className="font-bold text-[#00a3e0] uppercase tracking-wider text-[9px]">SOLO {t.perfilAutorizadoNom || 'ADMINISTRADOR'}</span>
                     </div>
                   </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ViajesPage() {
  const { isHidden, isReadOnly, loadingRestrictions } = useFieldSecurity("Viaje");
  const [loading, setLoading] = useState(true);
  const [viajes, setViajes] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  
  const [moviles, setMoviles] = useState<any[]>([]);
  const [personal, setPersonal] = useState<any[]>([]);
  const [formasPago, setFormasPago] = useState<any[]>([]);
  const [depositos, setDepositos] = useState<any[]>([]);
  const [zonas, setZonas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [currentId, setCurrentId] = useState<number | null>(null);

  const [form, setForm] = useState({
    movilId: "", choferDoc: "", ayudanteDoc: "", formaPagoId: "", 
    depositoId: "", tipo: "ZONA" as "ZONA" | "RUTA", 
    fechaProgramada: new Date().toISOString().split('T')[0],
    selectedZonas: [] as number[],
    selectedClientes: [] as string[],
    puntosCobroDetectados: [] as any[]
  });

  const [isViewMapOpen, setIsViewMapOpen] = useState(false);
  const [tripToView, setTripToView] = useState<any>(null);

  const [isTrazaOpen, setIsTrazaOpen] = useState(false);
  const [trazaLogs, setTrazaLogs] = useState<any[]>([]);
  const [loadingTraza, setLoadingTraza] = useState(false);

  const openTraza = async (viaId: number) => {
    setLoadingTraza(true);
    setIsTrazaOpen(true);
    setTrazaLogs([]);
    try {
      const res = await fetch(`/api/trazabilidad?orig=VIAJE&refId=${viaId}`);
      if (res.ok) setTrazaLogs(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoadingTraza(false); }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    console.log("Iniciando carga de datos para Viajes...");
    
    const loadList = async (url: string, setter: (data: any[]) => void, name: string) => {
      try {
        const userJson = localStorage.getItem("user");
        const user = userJson ? JSON.parse(userJson) : null;
        const tenantId = user?.tenantId || "public";
        
        const res = await fetch(url, {
          headers: {
            "x-tenant-id": tenantId,
            "x-user-email": user?.email || "",
            "x-user-profile": user?.perfil_cod?.toString() || ""
          }
        });
        if (res.ok) {
          const data = await res.json();
          console.log(`[Viajes] Cargados ${data.length || 0} registros de ${name}`, data);
          setter(Array.isArray(data) ? data : []);
        } else {
          console.error(`[Viajes] Error en API ${name}: ${res.status}`);
          setter([]);
        }
      } catch (e) {
        console.error(`[Viajes] Fallo crítico al cargar ${name}:`, e);
        setter([]);
      }
    };

    await Promise.all([
      loadList("/api/viajes", setViajes, "Viajes"),
      loadList("/api/admin/moviles", setMoviles, "Móviles"),
      loadList("/api/admin/personal-entrega", setPersonal, "Personal"),
      loadList("/api/formas-pago", setFormasPago, "Formas de Pago"),
      loadList("/api/admin/depositos", setDepositos, "Depósitos"),
      loadList("/api/admin/zonas", setZonas, "Zonas"),
      loadList("/api/admin/clientes?estado=A", setClientes, "Clientes")
    ]);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const detectGastos = async () => {
      const selectedIds = form.tipo === "ZONA" ? form.selectedZonas : form.selectedClientes;
      if (form.movilId && form.depositoId && selectedIds.length > 0) {
        try {
          const res = await fetch("/api/viajes/detectar-gastos", {
            method: "POST",
            body: JSON.stringify({
              movilId: form.movilId,
              depositoId: form.depositoId,
              formaPagoId: form.formaPagoId,
              tipo: form.tipo,
              selectedIds
            }),
            headers: { "Content-Type": "application/json" }
          });
          if (res.ok) {
            const data = await res.json();
            setForm(prev => ({ ...prev, puntosCobroDetectados: data }));
          }
        } catch (e) { console.error(e); }
      } else {
        setForm(prev => ({ ...prev, puntosCobroDetectados: [] }));
      }
    };

    const timer = setTimeout(detectGastos, 500);
    return () => clearTimeout(timer);
  }, [form.movilId, form.depositoId, form.formaPagoId, form.tipo, form.selectedZonas, form.selectedClientes]);

  const openCreate = () => {
    setIsEdit(false);
    setCurrentId(null);
    setForm({
      movilId: "", choferDoc: "", ayudanteDoc: "", formaPagoId: "", 
      depositoId: "", tipo: "ZONA", 
      fechaProgramada: new Date().toISOString().split('T')[0],
      selectedZonas: [],
      selectedClientes: [],
      puntosCobroDetectados: []
    });
    setIsModalOpen(true);
  };

  const openEdit = (v: any) => {
    setIsEdit(true);
    setCurrentId(v.via_id);
    const destinosIds = v.destinos?.map((d: any) => d.zon_id || d.cli_id) || [];
    
    const isRuta = v.via_tipo === "RUTA" || v.via_tipo === "CLIENTE";
    
    setForm({
      movilId: v.via_movil_id.toString(),
      choferDoc: v.via_chofer_doc,
      ayudanteDoc: v.via_ayudante_doc || "",
      formaPagoId: v.via_forma_pago_gastos_id.toString(),
      depositoId: v.via_deposito_origen_id.toString(),
      tipo: isRuta ? "RUTA" : "ZONA",
      fechaProgramada: new Date(v.via_fecha_programada).toISOString().split('T')[0],
      selectedZonas: v.via_tipo === "ZONA" ? destinosIds : [],
      selectedClientes: isRuta ? destinosIds : [],
      puntosCobroDetectados: v.peajes?.map((pc: any) => ({
        id: pc.vpc_pun_cob_id,
        nombre: pc.pun_cob_nombre || "Peaje",
        monto: pc.vpc_monto,
        tipo: "PEAJE"
      })) || []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const usuario = getLoggedUserEmail();
    
    const body = {
      ...form,
      via_id: currentId,
      puntosCobro: form.puntosCobroDetectados,
      usuario
    };

    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const tenantId = user?.tenantId || "public";

    const res = await fetch("/api/viajes", {
      method: isEdit ? "PUT" : "POST",
      body: JSON.stringify(body),
      headers: { 
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
        "x-user-email": user?.email || "",
        "x-user-profile": user?.perfil_cod?.toString() || ""
      }
    });

    if (res.ok) {
      setIsModalOpen(false);
      showToast(isEdit ? "Viaje actualizado con éxito" : "Viaje programado con éxito");
      fetchData();
    } else {
      const err = await res.json();
      showToast(err.error || "Error al procesar el viaje");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro que desea eliminar este viaje?")) return;
    
    try {
      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const tenantId = user?.tenantId || "public";

      const res = await fetch(`/api/viajes?id=${id}`, { 
        method: "DELETE",
        headers: {
          "x-tenant-id": tenantId,
          "x-user-email": user?.email || "",
          "x-user-profile": user?.perfil_cod?.toString() || ""
        }
      });
      if (res.ok) {
        showToast("Viaje eliminado correctamente");
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Error al eliminar el viaje");
      }
    } catch (e) {
      console.error(e);
      showToast("Error de conexión al eliminar");
    }
  };

  const formatPYG = (amount: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loadingRestrictions && loading) {
    return <div className="h-screen flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Sincronizando Seguridad...</div>;
  }

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500 bg-[#f8fafc] min-h-screen text-slate-700">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#00a3e0] flex items-center gap-3">
             <Truck className="h-9 w-9" /> Programación de Viajes
          </h1>
          <p className="text-[#64748b] text-sm mt-1">
             Gestiona la logística de entregas por zonas o rutas de clientes.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-[#00a3e0] hover:bg-[#008bc0] text-white font-bold py-2 px-6 rounded-lg shadow-2xl flex gap-2 h-[42px]">
          <Plus className="h-5 w-5" /> 
          <span>Nuevo Viaje</span>
        </Button>
      </div>

      <Card className="border-none shadow-[0_20px_50px_rgba(0,163,224,0.12)] shadow-2xl rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100/50">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
           <div>
              <h3 className="text-lg font-bold text-slate-800">Viajes Programados</h3>
              <p className="text-xs text-slate-400 mt-1">Listado de despachos y su estado actual de ejecución.</p>
           </div>
        </div>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  {!isHidden("via_id") && <th className="px-6 py-4 w-20">ID</th>}
                  {!isHidden("via_movil_id") && <th className="px-6 py-4">MÓVIL / CHAPA</th>}
                  {(!isHidden("via_chofer_doc") || !isHidden("via_ayudante_doc")) && <th className="px-6 py-4">PERSONAL</th>}
                  {!isHidden("via_tipo") && <th className="px-6 py-4">TIPO / DESTINOS</th>}
                  {!isHidden("via_fecha_programada") && <th className="px-6 py-4">FECHA PROG.</th>}
                  <th className="px-6 py-4 text-center">ESTADO</th>
                  <th className="px-6 py-4 text-center w-32">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                   <tr><td colSpan={10} className="px-6 py-12 text-center text-slate-400 italic">Cargando viajes...</td></tr>
                ) : viajes.length === 0 ? (
                   <tr><td colSpan={10} className="px-6 py-12 text-center text-slate-400 italic">No hay viajes programados.</td></tr>
                ) : viajes.map((v) => (
                  <tr key={v.via_id} className="hover:bg-slate-50/50 transition-colors">
                    {!isHidden("via_id") && <td className="px-6 py-4 text-xs text-slate-400 font-medium">#{v.via_id}</td>}
                    {!isHidden("via_movil_id") && (
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                            <span className="font-bold text-slate-700 uppercase">{v.movil?.marca?.mov_mar_nombre} {v.movil?.modelo?.mov_mod_nombre}</span>
                            <span className="text-[10px] font-black text-[#00a3e0] tracking-widest">{v.movil?.movil_chapa}</span>
                         </div>
                      </td>
                    )}
                    {(!isHidden("via_chofer_doc") || !isHidden("via_ayudante_doc")) && (
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-1">
                            {!isHidden("via_chofer_doc") && (
                              <div className="flex items-center gap-2">
                                 <Badge variant="outline" className="bg-slate-50 text-[8px] font-black border-slate-200">CHO</Badge>
                                 <span className="text-xs font-bold text-slate-600">{v.chofer?.per_ent_nombre}</span>
                              </div>
                            )}
                            {!isHidden("via_ayudante_doc") && v.ayudante && (
                               <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-slate-50 text-[8px] font-black border-slate-200">AYU</Badge>
                                  <span className="text-[11px] font-medium text-slate-500">{v.ayudante.per_ent_nombre}</span>
                               </div>
                            )}
                         </div>
                      </td>
                    )}
                    {!isHidden("via_tipo") && (
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-1">
                            <Badge className={`${v.via_tipo === 'ZONA' ? 'bg-amber-500' : 'bg-indigo-500'} text-[9px] font-bold w-fit`}>{v.via_tipo}</Badge>
                            <span className="text-[10px] text-slate-400 italic font-medium">
                               {v.destinos?.length || 0} {v.via_tipo === 'ZONA' ? 'zonas' : 'clientes'}
                            </span>
                         </div>
                      </td>
                    )}
                    {!isHidden("via_fecha_programada") && (
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="h-3.5 w-3.5 text-[#00a3e0]" />
                            <span className="text-xs font-bold text-slate-600">{formatDate(v.via_fecha_programada)}</span>
                         </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-center">
                       <StatusTransition 
                        viaId={v.via_id} 
                        estadoActual={v.via_estado} 
                        estadoActualNombre={v.via_estado_nombre}
                        onChanged={fetchData} 
                       />
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 gap-2 border-slate-200 hover:bg-slate-50 px-3 font-bold text-xs text-slate-600"
                              onClick={() => openTraza(v.via_id)}
                            >
                              <HistoryIcon className="h-3.5 w-3.5" /> Historial
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 gap-2 border-slate-200 hover:bg-slate-50 px-3 font-bold text-xs text-slate-600"
                              onClick={() => {
                                setTripToView(v);
                                setIsViewMapOpen(true);
                              }}
                            >
                              <Navigation className="h-3.5 w-3.5" /> Mapa
                            </Button>
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="h-8 gap-2 border-slate-200 hover:bg-slate-50 px-3 font-bold text-xs text-slate-600"
                             onClick={() => openEdit(v)}
                           >
                             <Edit className="h-3.5 w-3.5" /> Editar
                           </Button>
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="h-8 w-8 border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 p-0"
                             onClick={() => handleDelete(v.via_id)}
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
        </CardContent>
      </Card>

      <CustomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEdit ? `Editar Viaje #${currentId}` : "Programar Nuevo Viaje"}
        className="max-w-5xl"
      >
        <div className="flex flex-col max-h-[85vh]">
          <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-1 pr-3 space-y-8 pb-6 max-h-[60vh]">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-[#00a3e0] uppercase border-b border-slate-100 pb-2">Asignación de Personal y Móvil</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {!isHidden("via_movil_id") && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><Truck className="h-3.5 w-3.5 text-[#00a3e0]" /> Móvil Asignado</Label>
                        <select 
                          className="flex h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-[#00a3e0] outline-none" 
                          value={form.movilId} 
                          onChange={e => setForm({...form, movilId: e.target.value})} 
                          required
                          disabled={isReadOnly("via_movil_id")}
                        >
                          <option value="">Seleccione Móvil...</option>
                          {moviles.map(m => <option key={m.movil_id} value={m.movil_id}>{m.movil_chapa} - {m.marca?.mov_mar_nombre} {m.modelo?.mov_mod_nombre}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {!isHidden("via_chofer_doc") && (
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><Users className="h-3.5 w-3.5 text-[#00a3e0]" /> Chofer Principal</Label>
                          <select 
                            className="flex h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-[#00a3e0] outline-none" 
                            value={form.choferDoc} 
                            onChange={e => setForm({...form, choferDoc: e.target.value})} 
                            required
                            disabled={isReadOnly("via_chofer_doc")}
                          >
                            <option value="">Seleccione Chofer...</option>
                            {personal.filter(p => p.per_ent_tipo === 1).map(p => <option key={p.per_ent_documento} value={p.per_ent_documento}>{p.per_ent_nombre}</option>)}
                          </select>
                        </div>
                      )}
                      {!isHidden("via_ayudante_doc") && (
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><UserPlus className="h-3.5 w-3.5 text-[#00a3e0]" /> Ayudante</Label>
                          <select 
                            className="flex h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-[#00a3e0] outline-none" 
                            value={form.ayudanteDoc} 
                            onChange={e => setForm({...form, ayudanteDoc: e.target.value})}
                            disabled={isReadOnly("via_ayudante_doc")}
                          >
                            <option value="">(Sin Ayudante)</option>
                            {personal.filter(p => p.per_ent_tipo === 2).map(p => <option key={p.per_ent_documento} value={p.per_ent_documento}>{p.per_ent_nombre}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-[#00a3e0] uppercase border-b border-slate-100 pb-2">Programación y Origen</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {!isHidden("via_fecha_programada") && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><Calendar className="h-3.5 w-3.5 text-[#00a3e0]" /> Fecha Programada</Label>
                        <Input 
                          type="date" 
                          value={form.fechaProgramada} 
                          onChange={e => setForm({...form, fechaProgramada: e.target.value})} 
                          required 
                          className="h-11 rounded-xl text-slate-700" 
                          disabled={isReadOnly("via_fecha_programada")}
                        />
                      </div>
                    )}
                    {!isHidden("via_deposito_origen_id") && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><Package className="h-3.5 w-3.5 text-[#00a3e0]" /> Depósito de Origen</Label>
                        <select 
                          className="flex h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-[#00a3e0] outline-none" 
                          value={form.depositoId} 
                          onChange={e => setForm({...form, depositoId: e.target.value})} 
                          required
                          disabled={isReadOnly("via_deposito_origen_id")}
                        >
                          <option value="">Seleccione Origen...</option>
                          {depositos.map(d => <option key={d.deposito_id} value={d.deposito_id}>{d.deposito_nombre}</option>)}
                        </select>
                      </div>
                    )}
                    {!isHidden("via_forma_pago_gastos_id") && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><CreditCard className="h-3.5 w-3.5 text-[#00a3e0]" /> Forma de Pago Gastos</Label>
                        <select 
                          className="flex h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-[#00a3e0] outline-none" 
                          value={form.formaPagoId} 
                          onChange={e => setForm({...form, formaPagoId: e.target.value})} 
                          required
                          disabled={isReadOnly("via_forma_pago_gastos_id")}
                        >
                          <option value="">Seleccione...</option>
                          {formasPago.map(f => <option key={f.forma_pago_id} value={f.forma_pago_id}>{f.forma_pago_dsc}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[#00a3e0] uppercase border-b border-slate-100 pb-2 flex justify-between">
                  <span>Destinos y Trayecto</span>
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                    <button 
                      type="button" 
                      onClick={() => setForm({...form, tipo: "ZONA", selectedClientes: [], puntosCobroDetectados: []})} 
                      className={`px-4 py-1.5 text-[9px] font-black rounded-md transition-all ${form.tipo === "ZONA" ? "bg-white text-[#00a3e0] shadow-sm" : "text-slate-400"}`}
                    >
                      POR ZONA
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setForm({...form, tipo: "RUTA", selectedZonas: [], puntosCobroDetectados: []})} 
                      className={`px-4 py-1.5 text-[9px] font-black rounded-md transition-all ${form.tipo === "RUTA" ? "bg-white text-[#00a3e0] shadow-sm" : "text-slate-400"}`}
                    >
                      POR RUTA
                    </button>
                  </div>
                </h4>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="h-[250px] overflow-y-auto border border-slate-200 rounded-2xl p-2 bg-slate-50/50 space-y-1">
                    {form.tipo === "ZONA" ? (
                      zonas.length === 0 ? <p className="text-center py-10 text-[10px] italic text-slate-400">No hay zonas cargadas.</p> :
                      zonas.map(z => (
                        <label key={z.zon_id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-[#00a3e0]/30 transition-all">
                          <input 
                            type="checkbox" 
                            checked={form.selectedZonas.includes(z.zon_id)}
                            onChange={e => {
                              const next = e.target.checked 
                                ? [...form.selectedZonas, z.zon_id] 
                                : form.selectedZonas.filter(id => id !== z.zon_id);
                              setForm({...form, selectedZonas: next});
                            }}
                            className="h-4 w-4 rounded text-[#00a3e0] focus:ring-[#00a3e0]"
                          />
                          <div className="flex-1">
                            <div className="text-xs font-bold text-slate-700">{z.zon_nombre}</div>
                            <div className="text-[10px] text-slate-400">Zona Logística ID #{z.zon_id}</div>
                          </div>
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: z.zon_color }} />
                        </label>
                      ))
                    ) : (
                      clientes.length === 0 ? <p className="text-center py-10 text-[10px] italic text-slate-400">No hay clientes cargados.</p> :
                      clientes.map(c => (
                        <label key={c.cli_id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-[#00a3e0]/30 transition-all">
                          <input 
                            type="checkbox" 
                            checked={form.selectedClientes.includes(c.cli_id)}
                            onChange={e => {
                              const next = e.target.checked 
                                ? [...form.selectedClientes, c.cli_id] 
                                : form.selectedClientes.filter(id => id !== c.cli_id);
                              setForm({...form, selectedClientes: next});
                            }}
                            className="h-4 w-4 rounded text-[#00a3e0] focus:ring-[#00a3e0]"
                          />
                          <div className="flex-1">
                            <div className="text-xs font-bold text-slate-700">{c.cli_razon_social}</div>
                            <div className="text-[10px] text-slate-400">{c.cli_nro_doc}</div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>

                  <div className="flex-1 bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2 text-slate-600 font-bold text-sm uppercase tracking-wider">
                        <Navigation className="h-4 w-4 text-accent" /> Gastos Estimados
                      </div>
                      {form.puntosCobroDetectados.length > 0 && (
                        <Badge className="bg-accent/10 text-accent border-accent/20 font-bold">
                          {form.puntosCobroDetectados.length} PUNTOS
                        </Badge>
                      )}
                    </div>
                    
                    <div className="h-[1px] bg-slate-200 mb-6" />

                    {form.puntosCobroDetectados.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 opacity-60">
                        <Navigation className="h-8 w-8 text-slate-400" />
                        <p className="text-xs text-slate-500 font-medium">
                          Seleccione todos los parámetros para calcular peajes.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {form.puntosCobroDetectados.map((pc, idx) => (
                          <div key={`${pc.id}-${pc.monto}-${idx}`} className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <div>
                              <div className="text-sm font-bold text-slate-700">{pc.nombre}</div>
                              <div className="text-[10px] text-slate-400 uppercase font-bold">{pc.tipo}</div>
                            </div>
                            <div className="text-sm font-black text-accent">
                              {formatPYG(pc.monto)}
                            </div>
                          </div>
                        ))}

                        <div className="pt-4 mt-6 border-t border-slate-200">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Total Peajes</span>
                            <span className="text-2xl font-black text-slate-700">
                              {formatPYG(form.puntosCobroDetectados.reduce((acc, curr) => acc + Number(curr.monto), 0))}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-6 border-t border-slate-100 bg-white mt-auto">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="h-12 px-8 rounded-xl font-bold border-slate-200 hover:bg-slate-50">Cancelar</Button>
              <Button type="submit" className="h-12 px-12 rounded-xl font-bold bg-[#00a3e0] hover:brightness-105 text-white shadow-lg shadow-[#00a3e0]/20 flex gap-2">
                <CheckCircle2 className="h-5 w-5" /> Programar Viaje
              </Button>
            </div>
          </form>
        </div>
      </CustomModal>

      <CustomModal isOpen={isViewMapOpen} onClose={() => setIsViewMapOpen(false)} title={`Mapa de Ruta - Viaje #${tripToView?.via_id}`} className="max-w-4xl h-[80vh]">
         <div className="p-1 flex flex-col gap-4 h-full">
            <div className="h-[450px] w-full rounded-2xl overflow-hidden border border-slate-200 relative">
                {isViewMapOpen && tripToView && (
                  <TripMap 
                     origin={{ 
                        lat: tripToView.deposito_origen?.deposito_geo?.lat || -25.30066, 
                        lng: tripToView.deposito_origen?.deposito_geo?.lng || -57.63591, 
                        name: tripToView.deposito_origen?.deposito_nombre || "Origen" 
                     }}
                     destinations={tripToView.destinos?.map((d: any) => ({
                        lat: d.lat || -25.30,
                        lng: d.lng || -57.60,
                        name: d.zon_nombre
                     })) || []}
                  />
               )}
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4 text-xs">
               <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Vehículo</span>
                  <span className="font-bold text-slate-700">{tripToView?.movil?.movil_chapa} - {tripToView?.movil?.marca?.mov_mar_nombre}</span>
               </div>
               <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Chofer</span>
                  <span className="font-bold text-slate-700">{tripToView?.chofer?.per_ent_nombre}</span>
               </div>
            </div>
         </div>
      </CustomModal>
      
      {/* MODAL DE TRAZABILIDAD */}
      <CustomModal
        isOpen={isTrazaOpen}
        onClose={() => setIsTrazaOpen(false)}
        title="Historial de Movimientos"
        className="max-w-3xl"
      >
        <div className="flex flex-col gap-4 p-1">
          {loadingTraza ? (
            <div className="py-12 text-center text-slate-400 italic">Cargando historial...</div>
          ) : trazaLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic">No hay movimientos registrados para este viaje.</div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {trazaLogs.map((log: any, idx: number) => (
                <div key={log.flu_tra_id} className="relative pl-8 pb-4 border-l-2 border-slate-100 last:border-0 last:pb-0">
                  {/* Punto en la línea de tiempo */}
                  <div className="absolute left-[-9px] top-1 h-4 w-4 rounded-full bg-white border-2 border-blue-500 z-10" />
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 line-through decoration-red-200">
                          {log.flu_tra_estado_ant || "INICIO"}
                        </span>
                        <ArrowRight className="h-3 w-3 text-slate-300" />
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 text-[10px] font-black">
                          {log.flu_tra_estado_nue}
                        </Badge>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {new Date(log.flu_tra_fecha).toLocaleString('es-PY')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/50">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span className="text-[11px] font-medium text-slate-500">{log.usuario_nombre}</span>
                      </div>
                      
                      {log.lat && log.lng && (
                        <a 
                          href={`https://www.google.com/maps?q=${log.lat},${log.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] font-bold text-[#00a3e0] hover:underline"
                        >
                          <MapPin className="h-3 w-3" /> Ver GPS
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CustomModal>

      {toast && (
        <div className="fixed bottom-8 right-8 z-[3000] animate-in slide-in-from-right-10 duration-500">
          <div className="bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold uppercase tracking-widest">{toast}</span>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={async () => {
          if (!itemToDelete) return;
          const res = await fetch(`/api/viajes?id=${itemToDelete}`, { method: "DELETE" });
          if (res.ok) {
            setIsConfirmOpen(false);
            showToast("Viaje eliminado con éxito");
            fetchData();
          }
        }} 
        title="¿Eliminar Viaje?" 
        description="Esta acción cancelará la programación del despacho y eliminará los registros asociados." 
      />
    </div>
  );
}
