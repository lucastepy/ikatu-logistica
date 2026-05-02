"use client";

import { useFieldSecurity } from "@/hooks/useFieldSecurity";

import { useEffect, useState, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Hash, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  CheckCircle2, 
  Save, 
  Store,
  Globe,
  Activity,
  Map,
  Compass,
  Navigation,
  Upload,
  Image as ImageIcon,
  FileText,
  X,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EmpresaTenant {
  empresa_cod: number;
  empresa_nom: string | null;
  empresa_nom_fan: string | null;
  empresa_ruc: string | null;
  empresa_estado: string | null;
  empresa_mail: string | null;
  empresa_dir: string | null;
  empresa_tel: string | null;
  empresa_propietario: string | null;
  empresa_saldo: number | null;
  empresa_act_eco: number | null;
  empresa_dep: number | null;
  empresa_dis: number | null;
  empresa_ciu: number | null;
  empresa_bar: number | null;
  empresa_logo_empresa: string | null;
  empresa_logo_reporte: string | null;
}
// Componente optimizado para escritura fluida con Debounce
const FluidInput = ({ label, icon: Icon, value, onChange, ...props }: any) => {
  const [localValue, setLocalValue] = useState(value || "");
  const timeoutRef = useRef<any>(null);
  
  useEffect(() => {
    // Solo actualizar el valor local si no estamos escribiendo actualmente
    if (document.activeElement !== document.getElementById(props.id || label)) {
      setLocalValue(value || "");
    }
  }, [value, label, props.id]);

  const handleChange = (e: any) => {
    const val = e.target.value;
    setLocalValue(val);
    
    // Limpiar el timer anterior
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Programar la actualización del estado global para después de 300ms de calma
    timeoutRef.current = setTimeout(() => {
      onChange(val);
    }, 300);
  };

  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</Label>
      <div className="relative">
        <Input 
          {...props}
          id={props.id || label}
          value={localValue} 
          onChange={handleChange} 
          className={`h-12 rounded-2xl border-slate-200 bg-white focus:ring-accent transition-all pl-11 font-medium text-slate-950 shadow-sm ${props.className || ""}`}
        />
        {Icon && <Icon className="absolute left-4 top-3.5 h-5 w-5 text-slate-300" />}
      </div>
    </div>
  );
};

export default function MiEmpresaPage() {
  const { isHidden, isReadOnly, loadingRestrictions } = useFieldSecurity("Empresa");
  const [empresa, setEmpresa] = useState<EmpresaTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  // Listas de catálogos
  const [actividades, setActividades] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [distritos, setDistritos] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [barrios, setBarrios] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    empresa_cod: "",
    empresa_nom: "",
    empresa_nom_fan: "",
    empresa_ruc: "",
    empresa_mail: "",
    empresa_tel: "",
    empresa_dir: "",
    empresa_propietario: "",
    empresa_act_eco: "",
    empresa_dep: "",
    empresa_dis: "",
    empresa_ciu: "",
    empresa_bar: "",
    empresa_logo_empresa: "",
    empresa_logo_reporte: ""
  });

  // Referencias para archivos
  const logoEmpresaRef = useRef<HTMLInputElement>(null);
  const logoReporteRef = useRef<HTMLInputElement>(null);
  const [logoEmpresaFile, setLogoEmpresaFile] = useState<File | null>(null);
  const [logoReporteFile, setLogoReporteFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState({
    empresa: "",
    reporte: ""
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCatalogs = async () => {
    try {
      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const tenantId = user?.tenantId || "public";
      const commonHeaders = {
        "x-tenant-id": tenantId,
        "x-user-email": user?.email || "",
        "x-user-profile": user?.perfil_cod?.toString() || ""
      };

      const [resAct, resDep, resDis, resCiu, resBar] = await Promise.all([
        fetch("/api/admin/actividades-laborales", { headers: commonHeaders }),
        fetch("/api/admin/config-locations?type=dep", { headers: commonHeaders }),
        fetch("/api/admin/config-locations?type=dis", { headers: commonHeaders }),
        fetch("/api/admin/config-locations?type=ciu", { headers: commonHeaders }),
        fetch("/api/admin/config-locations?type=bar", { headers: commonHeaders })
      ]);
      
      const [dataAct, dataDep, dataDis, dataCiu, dataBar] = await Promise.all([
        resAct.json(), resDep.json(), resDis.json(), resCiu.json(), resBar.json()
      ]);

      setActividades(Array.isArray(dataAct) ? dataAct : []);
      setDepartamentos(Array.isArray(dataDep) ? dataDep : []);
      setDistritos(Array.isArray(dataDis) ? dataDis : []);
      setCiudades(Array.isArray(dataCiu) ? dataCiu : []);
      setBarrios(Array.isArray(dataBar) ? dataBar : []);
    } catch (e) {
      console.error("Error fetching catalogs:", e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await fetchCatalogs();
    try {
      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const tenantId = user?.tenantId || "public";

      const res = await fetch(`/api/empresa?tenantId=${tenantId}`, {
        headers: { 
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-email": user?.email || "",
          "x-user-profile": user?.perfil_cod?.toString() || ""
        }
      });
      const data = await res.json();
      if (res.ok) {
        setEmpresa(data);
        setFormData({
          empresa_cod: data.empresa_cod?.toString() || "",
          empresa_nom: data.empresa_nom || "",
          empresa_nom_fan: data.empresa_nom_fan || "",
          empresa_ruc: data.empresa_ruc || "",
          empresa_mail: data.empresa_mail || "",
          empresa_tel: data.empresa_tel || "",
          empresa_dir: data.empresa_dir || "",
          empresa_propietario: data.empresa_propietario || "",
          empresa_act_eco: data.empresa_act_eco?.toString() || "",
          empresa_dep: data.empresa_dep?.toString() || "",
          empresa_dis: data.empresa_dis?.toString() || "",
          empresa_ciu: data.empresa_ciu?.toString() || "",
          empresa_bar: data.empresa_bar?.toString() || "",
          empresa_logo_empresa: data.empresa_logo_empresa || "",
          empresa_logo_reporte: data.empresa_logo_reporte || ""
        });
        setPreviews({
          empresa: data.empresa_logo_empresa || "",
          reporte: data.empresa_logo_reporte || ""
        });
      }
    } catch (e) {
      console.error("Error fetching data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'empresa' | 'reporte') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'empresa') {
        setLogoEmpresaFile(file);
        setPreviews(prev => ({ ...prev, empresa: URL.createObjectURL(file) }));
      } else {
        setLogoReporteFile(file);
        setPreviews(prev => ({ ...prev, reporte: URL.createObjectURL(file) }));
      }
    }
  };

  const uploadFile = async (file: File) => {
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("cliDoc", formData.empresa_ruc || "logos");
    uploadFormData.append("dirId", "empresa");

    const res = await fetch("/api/upload", {
      method: "POST",
      body: uploadFormData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al subir archivo");
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.empresa_cod) {
      showToast("Error: No se pudo identificar la empresa");
      return;
    }
    setSaving(true);
    try {
      let logoEmpresaUrl = formData.empresa_logo_empresa;
      let logoReporteUrl = formData.empresa_logo_reporte;

      if (logoEmpresaFile) {
        logoEmpresaUrl = await uploadFile(logoEmpresaFile);
      }
      if (logoReporteFile) {
        logoReporteUrl = await uploadFile(logoReporteFile);
      }

      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const tenantId = user?.tenantId || "public";

      const res = await fetch("/api/empresa", {
        method: "PUT",
        body: JSON.stringify({
          ...formData,
          empresa_logo_empresa: logoEmpresaUrl,
          empresa_logo_reporte: logoReporteUrl,
          tenantId
        }),
        headers: { 
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-email": user?.email || "",
          "x-user-profile": user?.perfil_cod?.toString() || ""
        }
      });

      if (res.ok) {
        showToast("Configuración actualizada");
        setLogoEmpresaFile(null);
        setLogoReporteFile(null);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Error al actualizar");
      }
    } catch (error: any) {
      showToast(error.message || "Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  // Filtrado de cascada con validación de array
  const safeDepartamentos = useMemo(() => Array.isArray(departamentos) ? departamentos : [], [departamentos]);
  const safeDistritos = useMemo(() => Array.isArray(distritos) ? distritos : [], [distritos]);
  const safeCiudades = useMemo(() => Array.isArray(ciudades) ? ciudades : [], [ciudades]);
  const safeBarrios = useMemo(() => Array.isArray(barrios) ? barrios : [], [barrios]);
  const safeActividades = useMemo(() => Array.isArray(actividades) ? actividades : [], [actividades]);

  const filteredDistritos = useMemo(() => 
    safeDistritos.filter(d => d.dis_dep_cod?.toString() === formData.empresa_dep),
    [safeDistritos, formData.empresa_dep]
  );

  const filteredCiudades = useMemo(() => 
    safeCiudades.filter(c => 
      c.ciu_dep_cod?.toString() === formData.empresa_dep && 
      c.ciu_dis_cod?.toString() === formData.empresa_dis
    ),
    [safeCiudades, formData.empresa_dep, formData.empresa_dis]
  );

  const filteredBarrios = useMemo(() => 
    safeBarrios.filter(b => 
      b.bar_dep_cod?.toString() === formData.empresa_dep && 
      b.bar_dis_cod?.toString() === formData.empresa_dis &&
      b.bar_ciu_cod?.toString() === formData.empresa_ciu
    ),
    [safeBarrios, formData.empresa_dep, formData.empresa_dis, formData.empresa_ciu]
  );

  if (loadingRestrictions && loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-accent font-bold italic uppercase tracking-widest text-xs animate-pulse">
          Sincronizando Seguridad...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-8">
          <div className="bg-white/80 backdrop-blur-xl text-slate-600 px-8 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-4 border border-white/50 ring-1 ring-slate-100">
            <div className="bg-emerald-500/10 p-2 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="font-bold text-sm tracking-tight">{toast}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Mi Empresa</h1>
          <p className="text-muted mt-1 font-medium italic">Configuración de los datos operativos y legales de tu negocio.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Lado izquierdo: Info Básica */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="bg-card border-none shadow-xl rounded-3xl overflow-hidden text-center p-10">
            <div className="mx-auto w-32 h-32 rounded-3xl bg-accent/10 flex items-center justify-center text-accent mb-6 shadow-lg shadow-accent/5 overflow-hidden border-4 border-white">
              {previews.empresa ? (
                <img src={previews.empresa} alt="Logo Empresa" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="h-12 w-12" />
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-700 mb-1">{empresa?.empresa_nom}</h2>
            <p className="text-accent text-sm font-black italic mb-6 uppercase tracking-tighter">RUC: {empresa?.empresa_ruc}</p>
            
            <div className="space-y-3 pt-6 border-t border-slate-100">
               <div className="flex items-center gap-3 text-left">
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-400 border border-slate-100"><Globe className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Actividad Económica</p>
                    <p className="text-xs text-slate-600 font-black italic">{safeActividades.find(a => a.act_eco_cod.toString() === formData.empresa_act_eco)?.act_eco_dsc || 'No especificada'}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 text-left">
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-400 border border-slate-100"><MapPin className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Ubicación</p>
                    <p className="text-xs text-slate-600 font-black italic">
                      {safeDepartamentos.find(d => d.dep_cod.toString() === formData.empresa_dep)?.dep_dsc || 'N/A'}
                    </p>
                  </div>
               </div>
            </div>
          </Card>

          <Card className="bg-accent text-white p-6 rounded-3xl shadow-lg shadow-accent/20 relative overflow-hidden group">
             <div className="relative z-10">
                <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Información Importante</p>
                <p className="text-sm font-medium leading-relaxed italic">
                   Estos datos se reflejarán en todos tus documentos oficiales, reportes de viaje y trazabilidad del sistema.
                </p>
             </div>
             <Building2 className="absolute -right-8 -bottom-8 h-32 w-32 opacity-10 group-hover:scale-110 transition-transform" />
          </Card>
        </div>

        {/* Lado derecho: Formulario completo */}
        <div className="col-span-12 lg:col-span-8">
          <form onSubmit={handleSubmit}>
            <Card className="bg-card border-none shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                <CardTitle className="text-lg font-bold text-slate-700">Información General</CardTitle>
                <CardDescription className="text-xs font-medium">Actualice la información de su negocio de forma centralizada.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                
                {/* Gestión de Logos */}
                 <div className="bg-accent/5 p-6 rounded-2xl border border-accent/10 space-y-4">
                    <p className="text-[11px] font-black uppercase text-accent tracking-[0.2em] mb-2 border-b border-accent/10 pb-2 flex items-center gap-2">
                       <ImageIcon className="h-3 w-3" /> Imagen y Branding
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {!isHidden("empresa_logo_empresa") && (
                         <div className="space-y-2">
                           <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Logo de la Empresa</Label>
                           <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-4">
                                 <div className="h-16 w-16 rounded-xl bg-white border border-accent/20 flex items-center justify-center overflow-hidden">
                                    {previews.empresa ? (
                                      <img src={previews.empresa} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                      <ImageIcon className="h-6 w-6 text-accent/30" />
                                    )}
                                 </div>
                                 <input 
                                   type="file" 
                                   ref={logoEmpresaRef} 
                                   onChange={(e) => handleFileChange(e, 'empresa')} 
                                   className="hidden" 
                                   accept="image/*"
                                   disabled={isReadOnly("empresa_logo_empresa")}
                                 />
                                 <Button 
                                   type="button" 
                                   variant="outline" 
                                   onClick={() => logoEmpresaRef.current?.click()}
                                   className="h-10 border-accent/20 text-accent font-bold hover:bg-accent/5 rounded-xl gap-2"
                                   disabled={isReadOnly("empresa_logo_empresa")}
                                 >
                                   <Upload className="h-4 w-4" /> Seleccionar Logo
                                 </Button>
                              </div>
                              <p className="text-[10px] text-slate-400 italic">Recomendado: 512x512px (PNG o JPG).</p>
                           </div>
                         </div>
                       )}
                       {!isHidden("empresa_logo_reporte") && (
                         <div className="space-y-2">
                           <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Logo para Reportería</Label>
                           <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-4">
                                 <div className="h-16 w-16 rounded-xl bg-white border border-accent/20 flex items-center justify-center overflow-hidden">
                                    {previews.reporte ? (
                                      <img src={previews.reporte} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                      <FileText className="h-6 w-6 text-accent/30" />
                                    )}
                                 </div>
                                 <input 
                                   type="file" 
                                   ref={logoReporteRef} 
                                   onChange={(e) => handleFileChange(e, 'reporte')} 
                                   className="hidden" 
                                   accept="image/*"
                                   disabled={isReadOnly("empresa_logo_reporte")}
                                 />
                                 <Button 
                                   type="button" 
                                   variant="outline" 
                                   onClick={() => logoReporteRef.current?.click()}
                                   className="h-10 border-accent/20 text-accent font-bold hover:bg-accent/5 rounded-xl gap-2"
                                   disabled={isReadOnly("empresa_logo_reporte")}
                                 >
                                   <Upload className="h-4 w-4" /> Seleccionar Logo
                                 </Button>
                              </div>
                              <p className="text-[10px] text-slate-400 italic">Logo optimizado para impresión en PDF.</p>
                           </div>
                         </div>
                       )}
                    </div>
                 </div>

                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
                   <p className="text-[11px] font-black uppercase text-accent tracking-[0.2em] mb-2 border-b border-accent/10 pb-2 flex items-center gap-2">
                      <Store className="h-3 w-3" /> Identidad Corporativa
                   </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {!isHidden("empresa_nom") && (
                        <FluidInput 
                          label="Razón Social"
                          icon={Building2}
                          value={formData.empresa_nom}
                          onChange={(v: string) => setFormData(prev => ({...prev, empresa_nom: v}))}
                          required
                          disabled={isReadOnly("empresa_nom")}
                        />
                      )}
                      {!isHidden("empresa_nom_fan") && (
                        <FluidInput 
                          label="Nombre Fantasía"
                          icon={Store}
                          value={formData.empresa_nom_fan}
                          onChange={(v: string) => setFormData(prev => ({...prev, empresa_nom_fan: v}))}
                          disabled={isReadOnly("empresa_nom_fan")}
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {!isHidden("empresa_ruc") && (
                        <FluidInput 
                          label="RUC"
                          icon={Hash}
                          value={formData.empresa_ruc}
                          onChange={(v: string) => setFormData(prev => ({...prev, empresa_ruc: v}))}
                          className="font-mono"
                          required
                          disabled={isReadOnly("empresa_ruc")}
                        />
                      )}
                      {!isHidden("empresa_propietario") && (
                        <FluidInput 
                          label="Representante Legal"
                          icon={User}
                          value={formData.empresa_propietario}
                          onChange={(v: string) => setFormData(prev => ({...prev, empresa_propietario: v}))}
                          disabled={isReadOnly("empresa_propietario")}
                        />
                      )}
                    </div>

                   {!isHidden("empresa_act_eco") && (
                     <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Actividad Económica</Label>
                        <Select value={formData.empresa_act_eco} onValueChange={v => setFormData({...formData, empresa_act_eco: v})} disabled={isReadOnly("empresa_act_eco")}>
                          <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white pl-11 relative text-slate-950 font-medium shadow-sm">
                            <Activity className="absolute left-4 top-3.5 h-5 w-5 text-slate-300" />
                            <SelectValue placeholder="Seleccione una actividad" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                            {safeActividades.map(a => (
                              <SelectItem key={a.act_eco_cod} value={a.act_eco_cod.toString()}>{a.act_eco_dsc}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                     </div>
                   )}
                </div>

                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
                   <p className="text-[11px] font-black uppercase text-accent tracking-[0.2em] mb-2 border-b border-accent/10 pb-2 flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> Ubicación y Contacto
                   </p>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {!isHidden("empresa_dep") && (
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Departamento</Label>
                          <Select value={formData.empresa_dep} onValueChange={v => setFormData({...formData, empresa_dep: v, empresa_dis: "", empresa_ciu: "", empresa_bar: ""})} disabled={isReadOnly("empresa_dep")}>
                            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white pl-11 relative text-slate-950 font-medium shadow-sm">
                               <Map className="absolute left-4 top-3.5 h-5 w-5 text-slate-300" />
                               <SelectValue placeholder="Seleccione Departamento" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                              {safeDepartamentos.map(d => (
                                <SelectItem key={d.dep_cod} value={d.dep_cod.toString()}>{d.dep_dsc}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {!isHidden("empresa_dis") && (
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Distrito</Label>
                          <Select value={formData.empresa_dis} onValueChange={v => setFormData({...formData, empresa_dis: v, empresa_ciu: "", empresa_bar: ""})} disabled={!formData.empresa_dep || isReadOnly("empresa_dis")}>
                            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white pl-11 relative text-slate-950 font-medium shadow-sm">
                               <Compass className="absolute left-4 top-3.5 h-5 w-5 text-slate-300" />
                               <SelectValue placeholder="Seleccione Distrito" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                              {filteredDistritos.map(d => (
                                <SelectItem key={d.dis_cod} value={d.dis_cod.toString()}>{d.dis_dsc}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {!isHidden("empresa_ciu") && (
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ciudad</Label>
                          <Select value={formData.empresa_ciu} onValueChange={v => setFormData({...formData, empresa_ciu: v, empresa_bar: ""})} disabled={!formData.empresa_dis || isReadOnly("empresa_ciu")}>
                            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white pl-11 relative text-slate-950 font-medium shadow-sm">
                               <Building2 className="absolute left-4 top-3.5 h-5 w-5 text-slate-300" />
                               <SelectValue placeholder="Seleccione Ciudad" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                              {filteredCiudades.map(c => (
                                <SelectItem key={c.ciu_cod} value={c.ciu_cod.toString()}>{c.ciu_dsc}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {!isHidden("empresa_bar") && (
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Barrio</Label>
                          <Select value={formData.empresa_bar} onValueChange={v => setFormData({...formData, empresa_bar: v})} disabled={!formData.empresa_ciu || isReadOnly("empresa_bar")}>
                            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white pl-11 relative text-slate-950 font-medium shadow-sm">
                               <Navigation className="absolute left-4 top-3.5 h-5 w-5 text-slate-300" />
                               <SelectValue placeholder="Seleccione Barrio" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                              {filteredBarrios.map(b => (
                                <SelectItem key={b.bar_cod} value={b.bar_cod.toString()}>{b.bar_dsc}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {!isHidden("empresa_mail") && (
                        <FluidInput 
                          label="Email de Contacto"
                          icon={Mail}
                          type="email"
                          value={formData.empresa_mail}
                          onChange={(v: string) => setFormData(prev => ({...prev, empresa_mail: v}))}
                          disabled={isReadOnly("empresa_mail")}
                        />
                      )}
                      {!isHidden("empresa_tel") && (
                        <FluidInput 
                          label="Teléfono"
                          icon={Phone}
                          value={formData.empresa_tel}
                          onChange={(v: string) => setFormData(prev => ({...prev, empresa_tel: v}))}
                          disabled={isReadOnly("empresa_tel")}
                        />
                      )}
                   </div>

                   {!isHidden("empresa_dir") && (
                     <FluidInput 
                       label="Dirección Comercial Exacta"
                       icon={MapPin}
                       value={formData.empresa_dir}
                       onChange={(v: string) => setFormData(prev => ({...prev, empresa_dir: v}))}
                       disabled={isReadOnly("empresa_dir")}
                     />
                   )}
                </div>

                 <div className="pt-8 border-t border-slate-100 flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="bg-accent text-white font-bold h-14 px-10 rounded-2xl shadow-xl shadow-accent/20 flex gap-3 uppercase tracking-tighter transition-all active:scale-95 disabled:opacity-70 disabled:scale-100"
                    >
                      {saving ? (
                         <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                         <Save className="h-5 w-5" />
                      )}
                      {saving ? "Guardando..." : "Guardar Configuración"}
                    </Button>
                 </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
