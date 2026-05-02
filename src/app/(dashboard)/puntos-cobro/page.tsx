"use client";

import { useFieldSecurity } from "@/hooks/useFieldSecurity";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomModal } from "@/components/ui/dialog-custom";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { 
  Plus, Edit3, Trash2, CheckCircle2, Save, Search, 
  MapPin, DollarSign, Wallet, Hash, Type, Navigation, Loader2
} from "lucide-react";
import { getLoggedUserEmail } from "@/lib/auth-utils";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";

// Mapa dinámico para evitar errores de SSR con Leaflet
const PointMap = dynamic(() => import("../../../components/maps/PointMap"), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-2xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400">Cargando Mapa...</div>
}) as any;

export default function PuntosCobroPage() {
  const { isHidden, isReadOnly, loadingRestrictions } = useFieldSecurity("PuntoCobro");
  const [data, setData] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [formasPago, setFormasPago] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTabModal, setActiveTabModal] = useState<"general" | "tarifas">("general");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    tipo: "",
    lat: -25.2865,
    lng: -57.6470
  });

  const [tarifasMatrix, setTarifasMatrix] = useState<any>({}); // { "catId-fpId": monto }
  const [formasPagoSeleccionadas, setFormasPagoSeleccionadas] = useState<number[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

      const [resPuntos, resTipos, resCats, resFp] = await Promise.all([
        fetch("/api/puntos-cobro", { headers: commonHeaders }),
        fetch("/api/tipo-puntos-cobro", { headers: commonHeaders }),
        fetch("/api/movil-categorias", { headers: commonHeaders }),
        fetch("/api/formas-pago", { headers: commonHeaders })
      ]);

      const [puntos, tipos, cats, fp] = await Promise.all([
        resPuntos.json(),
        resTipos.json(),
        resCats.json(),
        resFp.json()
      ]);

      setData(Array.isArray(puntos) ? puntos : []);
      setTipos(Array.isArray(tipos) ? tipos : []);
      setCategorias(Array.isArray(cats) ? cats : []);
      setFormasPago(Array.isArray(fp) ? fp : []);
    } catch (e) { 
      console.error(e); 
      setData([]);
      setTipos([]);
      setCategorias([]);
      setFormasPago([]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ id: "", nombre: "", tipo: "", lat: -25.2865, lng: -57.6470 });
    setTarifasMatrix({});
    setFormasPagoSeleccionadas([]);
    setActiveTabModal("general");
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      id: item.pun_cob_id.toString(),
      nombre: item.pun_cob_nombre,
      tipo: item.pun_cob_tipo.toString(),
      lat: item.lat,
      lng: item.lng
    });

    // Cargar matriz de tarifas
    const matrix: any = {};
    if (item.tarifas) {
      item.tarifas.forEach((t: any) => {
        matrix[`${t.pun_tar_mov_cat_id}-${t.pun_tar_forma_pago_id}`] = t.pun_tar_monto;
      });
    }
    setTarifasMatrix(matrix);
    setFormasPagoSeleccionadas(item.formas_pago_habilitadas || []);
    setActiveTabModal("general");
    setIsModalOpen(true);
  };

  const toggleFormaPago = (id: number) => {
    setFormasPagoSeleccionadas(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const formatNumber = (val: string | number) => {
    if (!val && val !== 0) return "";
    let str = val.toString();
    
    // Si termina en coma o punto, dejamos que el usuario siga escribiendo
    if (str.endsWith(",") || str.endsWith(".")) return str;

    const parts = str.split(/[.,]/);
    let integerPart = parts[0].replace(/\D/g, "");
    let decimalPart = parts.length > 1 ? parts[1].replace(/\D/g, "") : null;

    if (integerPart === "" && decimalPart === null) return "";
    if (integerPart === "" && decimalPart !== null) return `0,${decimalPart}`;
    
    const formattedInteger = new Intl.NumberFormat('es-PY').format(parseInt(integerPart));
    return decimalPart !== null ? `${formattedInteger},${decimalPart}` : formattedInteger;
  };

  const updateTarifa = (catId: number, fpId: number, val: string) => {
    // Permitir números y un separador decimal (convertimos coma a punto para el estado)
    const normalized = val.replace(",", ".");
    // Validar que sea un número válido (opcionalmente decimal)
    if (normalized === "" || /^\d*\.?\d*$/.test(normalized)) {
      setTarifasMatrix({
        ...tarifasMatrix,
        [`${catId}-${fpId}`]: normalized
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const tenantId = user?.tenantId || "public";
    const usuarioEmail = user?.email || "SISTEMA";

    // Convertir matriz a array para la API (SOLO de las seleccionadas)
    const tarifasArray = Object.entries(tarifasMatrix)
      .filter(([key, monto]) => {
        const [_, formaPagoId] = key.split("-");
        return formasPagoSeleccionadas.includes(parseInt(formaPagoId)) && monto !== "" && monto !== undefined;
      })
      .map(([key, monto]) => {
        const [catId, formaPagoId] = key.split("-");
        return { catId, formaPagoId, monto };
      });

    setIsSubmitting(true);
    try {
      const method = editingItem ? "PUT" : "POST";
      const url = editingItem ? `/api/puntos-cobro/${editingItem.pun_cob_id}` : "/api/puntos-cobro";

      const res = await fetch(url, { 
        method, 
        body: JSON.stringify({ 
          ...formData, 
          usuario: usuarioEmail, 
          tarifas: tarifasArray,
          formasPagoHabilitadas: formasPagoSeleccionadas
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
        showToast(editingItem ? "Registro actualizado" : "Registro creado"); 
        fetchData(); 
      }
    } catch (e) {
      console.error(e);
      showToast("Error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredData = data.filter(item => 
    item.pun_cob_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tipo_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loadingRestrictions && loading) {
    return <div className="h-screen flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Sincronizando Seguridad...</div>;
  }

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-8">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/50 backdrop-blur-xl">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="font-bold text-sm">{toast}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Puntos de Cobro</h1>
          <p className="text-muted mt-1 font-medium italic">Administración de peajes, pesajes y puestos de control.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold hover:brightness-105 h-11 px-6 rounded-xl shadow-lg shadow-accent/20 transition-all">
          <MapPin className="h-4 w-4 mr-2" /> Registrar Punto
        </Button>
      </div>

      <Card className="bg-card border-none shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
           <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-slate-700">Puntos de Control</CardTitle>
                <CardDescription className="text-xs">Ubicación y costos base por categoría.</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                <Input 
                  placeholder="Buscar por nombre o tipo..." 
                  className="h-10 border-slate-200 bg-white w-80 pl-9 text-sm rounded-xl focus:ring-accent" 
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
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] tracking-tight text-slate-400 font-bold uppercase">
                  {!isHidden("pun_cob_nombre") && <th className="px-8 py-4">Punto de Cobro</th>}
                  {!isHidden("pun_cob_tipo") && <th className="px-8 py-4">Tipo</th>}
                  {!isHidden("lat") && !isHidden("lng") && <th className="px-8 py-4">Ubicación</th>}
                  <th className="px-8 py-4">Última Modificación</th>
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-400 italic">Cargando...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-400 italic">No hay registros.</td></tr>
                ) : currentItems.map((item) => (
                  <tr key={item.pun_cob_id} className="hover:bg-slate-50/30 transition-colors">
                    {!isHidden("pun_cob_nombre") && (
                      <td className="px-8 py-4">
                        <span className="font-bold text-slate-700">{item.pun_cob_nombre}</span>
                      </td>
                    )}
                    {!isHidden("pun_cob_tipo") && (
                      <td className="px-8 py-4">
                        <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20 font-bold uppercase text-[9px] tracking-widest">
                          {item.tipo_nombre}
                        </Badge>
                      </td>
                    )}
                    {!isHidden("lat") && !isHidden("lng") && (
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                          <Navigation className="h-3 w-3" />
                          <span>{item.lat.toFixed(4)}, {item.lng.toFixed(4)}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-8 py-4">
                       <div className="flex flex-col text-[10px]">
                         <span className="text-slate-500 font-bold uppercase">{item.usuario_mod_nombre || item.usuario_alta_nombre}</span>
                         <span className="text-slate-400 italic">{new Date(item.pun_cob_fecha_mod || item.pun_cob_fecha_alta).toLocaleString()}</span>
                       </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 gap-2 border-slate-200 hover:bg-slate-50 px-3 font-bold text-xs text-slate-600"><Edit3 className="h-3.5 w-3.5 stroke-[2.5]" /> Editar</Button>
                         <Button onClick={() => {setItemToDelete(item); setIsConfirmOpen(true);}} variant="outline" size="icon" className="h-8 w-8 text-red-500 border-transparent hover:bg-red-50"><Trash2 className="h-3.5 w-3.5 stroke-[2.5]" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
             <span className="text-[11px] font-bold text-slate-400 uppercase">Total: {filteredData.length} Puntos</span>
             <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setCurrentPage(Math.max(1, currentPage-1))} disabled={currentPage===1}>Anterior</Button>
                <div className="flex items-center px-4 bg-white border border-slate-200 rounded-lg text-xs font-bold text-accent">{currentPage} / {totalPages || 1}</div>
                <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setCurrentPage(Math.min(totalPages, currentPage+1))} disabled={currentPage===totalPages || totalPages === 0}>Siguiente</Button>
             </div>
          </div>
        </CardContent>
      </Card>

      <CustomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`${editingItem ? 'Editar' : 'Nuevo'} Punto de Cobro`} 
        className="max-w-5xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-white/50 backdrop-blur-xl"
      >
        <div className="flex gap-2 p-1 bg-slate-100/50 rounded-xl w-fit border border-slate-200 mb-6">
          <button 
            type="button"
            onClick={() => setActiveTabModal("general")}
            className={`px-6 py-2 rounded-lg font-bold text-xs transition-all ${activeTabModal === "general" ? "bg-white text-accent shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
          >
            Información General
          </button>
          <button 
            type="button"
            onClick={() => setActiveTabModal("tarifas")}
            className={`px-6 py-2 rounded-lg font-bold text-xs transition-all ${activeTabModal === "tarifas" ? "bg-white text-accent shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
          >
            Matriz de Tarifas
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTabModal === "general" ? (
            <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-left-4 duration-300">
               <div className="space-y-4">
                  <div className="bg-accent/5 p-4 rounded-2xl border border-accent/10 flex items-center gap-4 mb-2">
                     <div className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center">
                        <Wallet className="h-5 w-5" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-slate-700 leading-tight">Datos del Punto</p>
                        <p className="text-[11px] text-slate-500 italic">Información básica y costos.</p>
                     </div>
                  </div>

                  {!isHidden("pun_cob_nombre") && (
                    <div className="space-y-2">
                       <Label className="flex items-center gap-2"><Type className="h-3 w-3 text-accent" /> Nombre</Label>
                       <Input 
                          value={formData.nombre} 
                          onChange={e => setFormData({...formData, nombre: e.target.value})} 
                          placeholder="Nombre del punto..." 
                          required 
                          autoFocus 
                          className="h-12 rounded-xl text-slate-950 font-medium border-slate-200 focus:border-accent focus:ring-accent bg-white" 
                          disabled={isReadOnly("pun_cob_nombre")}
                       />
                    </div>
                  )}

                  {!isHidden("pun_cob_tipo") && (
                    <div className="space-y-2">
                       <Label className="flex items-center gap-2"><Settings2 className="h-3 w-3 text-accent" /> Tipo de Cobro</Label>
                       <select 
                        className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 font-medium focus:ring-2 focus:ring-accent outline-none" 
                        value={formData.tipo} 
                        onChange={e => setFormData({...formData, tipo: e.target.value})} 
                        required
                        disabled={isReadOnly("pun_cob_tipo")}
                       >
                          <option value="">Seleccione un tipo...</option>
                          {tipos.map(t => <option key={t.tip_pun_cob_id} value={t.tip_pun_cob_id}>{t.tip_pun_cob_nombre}</option>)}
                       </select>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">Formas de Pago Habilitadas</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {formasPago.map(fp => (
                        <div key={fp.forma_pago_id} onClick={() => toggleFormaPago(fp.forma_pago_id)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formasPagoSeleccionadas.includes(fp.forma_pago_id) ? "bg-accent/5 border-accent text-accent font-bold" : "bg-slate-50 border-slate-200 text-slate-400 opacity-60 hover:opacity-100"}`}>
                          <div className={`h-4 w-4 rounded border flex items-center justify-center ${formasPagoSeleccionadas.includes(fp.forma_pago_id) ? "bg-accent border-accent text-white" : "bg-white border-slate-300"}`}>
                            {formasPagoSeleccionadas.includes(fp.forma_pago_id) && <CheckCircle2 className="h-3 w-3" />}
                          </div>
                          <span className="text-[11px] uppercase tracking-tight">{fp.forma_pago_dsc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                           <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-slate-700 leading-tight">Geolocalización</p>
                           <p className="text-[11px] text-slate-500 italic">Posición en el mapa.</p>
                        </div>
                     </div>
                     <Badge variant="outline" className="text-[10px] font-mono bg-white">{formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}</Badge>
                  </div>

                  {!isHidden("lat") && !isHidden("lng") && (
                    <PointMap 
                       lat={formData.lat} 
                       lng={formData.lng} 
                       onChange={(lat: number, lng: number) => {
                         if (!isReadOnly("lat") && !isReadOnly("lng")) {
                           setFormData({...formData, lat, lng});
                         }
                       }} 
                    />
                  )}
               </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex items-center gap-4 mb-6">
                  <div className="h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center">
                     <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                     <p className="text-sm font-bold text-slate-700 leading-tight">Matriz de Tarifas por Categoría</p>
                     <p className="text-[11px] text-slate-500 italic">Defina el monto específico para cada combinación de categoría y forma de pago.</p>
                  </div>
               </div>

               <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                           <th className="px-6 py-4">Categoría de Vehículo</th>
                           {formasPago.filter(fp => formasPagoSeleccionadas.includes(fp.forma_pago_id)).map(fp => (
                              <th key={fp.forma_pago_id} className="px-6 py-4 text-center border-l border-slate-100 bg-slate-50/50">
                                 {fp.forma_pago_dsc}
                              </th>
                           ))}
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {categorias.map(cat => (
                           <tr key={cat.mov_cat_id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                 <p className="font-bold text-slate-700 text-xs uppercase">{cat.mov_cat_dsc}</p>
                                 <p className="text-[9px] text-slate-400 font-medium">ID: {cat.mov_cat_id}</p>
                              </td>
                              {formasPago.filter(fp => formasPagoSeleccionadas.includes(fp.forma_pago_id)).map(fp => {
                                 const key = `${cat.mov_cat_id}-${fp.forma_pago_id}`;
                                 return (
                                    <td key={fp.forma_pago_id} className="px-4 py-3 border-l border-slate-100">
                                       <div className="relative group">
                                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300 group-focus-within:text-accent transition-colors" />
                                          <Input 
                                             type="text" 
                                             className="h-10 pl-8 text-xs font-medium rounded-lg border-slate-200 focus:ring-accent text-right text-slate-950 bg-white"
                                             placeholder="0"
                                             value={formatNumber(tarifasMatrix[key] || "")}
                                             onChange={(e) => updateTarifa(cat.mov_cat_id, fp.forma_pago_id, e.target.value)}
                                          />
                                       </div>
                                    </td>
                                 );
                              })}
                           </tr>
                        ))}
                        {formasPagoSeleccionadas.length === 0 && (
                          <tr>
                            <td colSpan={formasPago.length + 1} className="px-6 py-20 text-center text-slate-400 italic text-sm">
                              Debe seleccionar al menos una forma de pago en la pestaña General para configurar tarifas.
                            </td>
                          </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t border-slate-100">
             <Button type="submit" disabled={isSubmitting} className="flex-1 bg-accent text-white font-bold h-12 rounded-2xl shadow-lg flex gap-2 uppercase tracking-tighter transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:scale-100">
               {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
               {isSubmitting ? "Guardando..." : "Guardar Punto de Cobro"}
             </Button>
             <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-tighter text-slate-500">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={async () => {
          if (!itemToDelete) return;
          const userJson = localStorage.getItem("user");
          const user = userJson ? JSON.parse(userJson) : null;
          const tenantId = user?.tenantId || "public";

          const res = await fetch(`/api/puntos-cobro/${itemToDelete.pun_cob_id}`, { 
            method: "DELETE",
            headers: {
              "x-tenant-id": tenantId,
              "x-user-email": user?.email || "",
              "x-user-profile": user?.perfil_cod?.toString() || ""
            }
          });
          if (res.ok) { setIsConfirmOpen(false); showToast("Punto eliminado"); fetchData(); }
        }} 
        title="¿Eliminar Punto de Cobro?" 
        description="Esta acción eliminará el punto y su ubicación permanentemente." 
      />
    </div>
  );
}

// Icono auxiliar que faltaba
function Settings2(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
  )
}
