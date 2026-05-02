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
  Plus, Users, Edit3, Trash2, CheckCircle2, Save, Search, 
  ChevronLeft, ChevronRight, UserPlus, Phone, Mail, FileText, ShieldCheck,
  Fingerprint, Lock, MapPin, Navigation, Map as MapIcon, Image as ImageIcon,
  PlusCircle, X, ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";

// Mapa dinámico con tipado relajado para evitar errores de IntrinsicAttributes
const PointMap = dynamic(() => import("../../../components/maps/PointMap"), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 border border-dashed border-slate-300">Cargando Mapa...</div>
}) as any;

export default function ClientesPage() {
  const { isHidden, isReadOnly, loadingRestrictions } = useFieldSecurity("Cliente");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoDocs, setTipoDocs] = useState<any[]>([]);
  
  // Modales Principales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isAddrConfirmOpen, setIsAddrConfirmOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [addrToDelete, setAddrToDelete] = useState<string | null>(null);

  // Gestión de Direcciones
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [isDirModalOpen, setIsDirModalOpen] = useState(false);
  const [direcciones, setDirecciones] = useState<any[]>([]);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [fullImage, setFullImage] = useState<string | null>(null);

  // Auxiliares Geográficos
  const [deps, setDeps] = useState<any[]>([]);
  const [distritos, setDistritos] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [barrios, setBarrios] = useState<any[]>([]);
  const [zonas, setZonas] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    razonSocial: "",
    tipDocId: "",
    nroDoc: "", 
    esContribuyente: false,
    telefono: "",
    email: "",
    estado: "A"
  });

  const [addressData, setAddressData] = useState({
    telefono: "",
    email: "",
    barDepCod: "",
    barDisCod: "",
    barCiuCod: "",
    barCod: "",
    zonId: "",
    calle: "",
    nroCasa: "",
    referencia: "",
    lat: -25.2865,
    lng: -57.6470,
    fotoUrl: "",
    fotoDsc: ""
  });

  const [rucDV, setRucDV] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const calcularDV = (numero: string) => {
    if (!numero || isNaN(Number(numero))) return "";
    let total = 0;
    let k = 2;
    const basemax = 11;
    for (let i = numero.length - 1; i >= 0; i--) {
      total += parseInt(numero[i]) * k;
      k++;
      if (k > basemax) k = 2;
    }
    const resto = total % 11;
    return (resto > 1 ? 11 - resto : 0).toString();
  };

  useEffect(() => {
    if (formData.esContribuyente) {
      setFormData(prev => ({ ...prev, tipDocId: "RUC" }));
      if (formData.nroDoc) setRucDV(calcularDV(formData.nroDoc));
      else setRucDV("");
    }
  }, [formData.esContribuyente, formData.nroDoc]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const tenantId = user?.tenantId || "public";

      const res = await fetch("/api/clientes", {
        headers: {
          "x-tenant-id": tenantId,
          "x-user-email": user?.email || "",
          "x-user-profile": user?.perfil_cod?.toString() || ""
        }
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchAuxGeog = async () => {
    try {
      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const tenantId = user?.tenantId || "public";
      const headers = {
        "x-tenant-id": tenantId,
        "x-user-email": user?.email || "",
        "x-user-profile": user?.perfil_cod?.toString() || ""
      };

      const [rDep, rDis, rCiu, rBar, rZon] = await Promise.all([
        fetch("/api/admin/config-locations?type=dep", { headers }),
        fetch("/api/admin/config-locations?type=dis", { headers }),
        fetch("/api/admin/config-locations?type=ciu", { headers }),
        fetch("/api/admin/config-locations?type=bar", { headers }),
        fetch("/api/admin/config-locations?type=zon", { headers })
      ]);

      setDeps(await rDep.json());
      setDistritos(await rDis.json());
      setCiudades(await rCiu.json());
      setBarrios(await rBar.json());
      setZonas(await rZon.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const tenantId = user?.tenantId || "public";
    const headers = {
      "x-tenant-id": tenantId,
      "x-user-email": user?.email || "",
      "x-user-profile": user?.perfil_cod?.toString() || ""
    };

    fetchData();
    fetchAuxGeog();
    fetch("/api/tipo-documentos", { headers }).then(r => r.json()).then(j => setTipoDocs(j));
  }, []);

  const openCreate = () => {
    setEditingItem(null);
    setRucDV("");
    setFormData({ razonSocial: "", tipDocId: "", nroDoc: "", esContribuyente: false, telefono: "", email: "", estado: "A" });
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      razonSocial: item.cli_razon_social,
      tipDocId: item.cli_tip_doc_id,
      nroDoc: item.cli_es_contribuyente ? item.cli_nro_doc.split("-")[0] : item.cli_nro_doc,
      esContribuyente: item.cli_es_contribuyente || false,
      telefono: item.cli_telefono || "",
      email: item.cli_email || "",
      estado: item.cli_estado
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const tenantId = user?.tenantId || "public";

    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/clientes/${editingItem.cli_id}` : "/api/clientes";
    const finalData = { ...formData, nroDoc: formData.esContribuyente ? `${formData.nroDoc}-${rucDV}` : formData.nroDoc };
    const res = await fetch(url, { 
      method, 
      body: JSON.stringify(finalData), 
      headers: { 
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
        "x-user-email": user?.email || "",
        "x-user-profile": user?.perfil_cod?.toString() || ""
      } 
    });
    if (res.ok) { setIsModalOpen(false); showToast(editingItem ? "Cliente actualizado" : "Cliente registrado"); fetchData(); }
  };

  const openDirecciones = async (cliente: any) => {
    setSelectedCliente(cliente);
    setIsDirModalOpen(true);
    fetchDirecciones(cliente.cli_id);
  };

  const fetchDirecciones = async (cliId: string) => {
    try {
      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const tenantId = user?.tenantId || "public";

      const res = await fetch(`/api/clientes/${cliId}/direcciones`, {
        headers: {
          "x-tenant-id": tenantId,
          "x-user-email": user?.email || "",
          "x-user-profile": user?.perfil_cod?.toString() || ""
        }
      });
      const json = await res.json();
      setDirecciones(Array.isArray(json) ? json : []);
    } catch (e) {
      console.error(e);
      setDirecciones([]);
    }
  };

  const handleDeleteImage = async (url: string) => {
    if (!url) return;
    try {
      const res = await fetch("/api/upload", {
        method: "DELETE",
        body: JSON.stringify({ url }),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setAddressData({ ...addressData, fotoUrl: "" });
        showToast("Imagen eliminada");
      }
    } catch (err) {
      console.error(err);
      showToast("Error al borrar imagen");
    }
  };

  const openAddAddress = () => {
    setEditingAddress(null);
    setAddressData({
      telefono: "", email: "", barDepCod: "", barDisCod: "", barCiuCod: "", barCod: "", 
      zonId: "", calle: "", nroCasa: "", referencia: "", lat: -25.2865, lng: -57.6470, fotoUrl: "", fotoDsc: ""
    });
    setIsAddressFormOpen(true);
  };

  const openEditAddress = (dir: any) => {
    setEditingAddress(dir);
    
    // Buscamos el barrio en nuestra lista local para recuperar su Dpto/Dist/Ciu
    const b = barrios.find(bar => bar.bar_cod === dir.dir_bar_cod);

    setAddressData({
      telefono: dir.dir_telefono || "",
      email: dir.dir_email || "",
      barDepCod: b ? b.bar_dep_cod.toString() : "",
      barDisCod: b ? b.bar_dis_cod.toString() : "",
      barCiuCod: b ? b.bar_ciu_cod.toString() : "",
      barCod: dir.dir_bar_cod.toString(),
      zonId: (dir.zon_id || "").toString(),
      calle: dir.dir_calle_principal,
      nroCasa: dir.dir_nro_casa || "",
      referencia: dir.dir_referencia || "",
      lat: dir.lat,
      lng: dir.lng,
      fotoUrl: dir.dir_foto_url || "",
      fotoDsc: dir.dir_foto_descripcion || ""
    });
    setIsAddressFormOpen(true);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingAddress ? "PUT" : "POST";
    const url = editingAddress 
      ? `/api/clientes/${selectedCliente.cli_id}/direcciones/${editingAddress.dir_id}` 
      : `/api/clientes/${selectedCliente.cli_id}/direcciones`;
    
    // Solo enviamos lo necesario para la estructura actual de la DB
    const payload = {
      telefono: addressData.telefono,
      email: addressData.email,
      barCod: addressData.barCod,
      zonId: addressData.zonId,
      calle: addressData.calle,
      nroCasa: addressData.nroCasa,
      referencia: addressData.referencia,
      lat: addressData.lat,
      lng: addressData.lng,
      fotoUrl: addressData.fotoUrl,
      fotoDsc: addressData.fotoDsc
    };

    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const tenantId = user?.tenantId || "public";

    const res = await fetch(url, { 
      method, 
      body: JSON.stringify(payload), 
      headers: { 
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
        "x-user-email": user?.email || "",
        "x-user-profile": user?.perfil_cod?.toString() || ""
      } 
    });
    if (res.ok) {
      setIsAddressFormOpen(false);
      showToast(editingAddress ? "Dirección actualizada" : "Dirección agregada");
      fetchDirecciones(selectedCliente.cli_id);
    }
  };

  const deleteAddress = async (dirId: string) => {
    setAddrToDelete(dirId);
    setIsAddrConfirmOpen(true);
  };

  const filteredData = data.filter(item => 
    item.cli_razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.cli_nro_doc.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loadingRestrictions && loading) {
    return <div className="h-screen flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Sincronizando Seguridad...</div>;
  }

  return (
    <div className="p-8 space-y-6 relative">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-8 duration-300">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/50 backdrop-blur-xl">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="font-bold text-sm">{toast}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Gestión de Clientes</h1>
          <p className="text-muted mt-1 font-medium italic">Administración de la cartera de clientes y sus ubicaciones logísticas.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold hover:brightness-105 h-11 px-6 rounded-xl shadow-lg shadow-accent/20 transition-all">
          <UserPlus className="h-4 w-4 mr-2 stroke-[3]" /> Registrar Cliente
        </Button>
      </div>

      <Card className="bg-card border-none shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
           <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-slate-700">Cartera de Clientes</CardTitle>
                <CardDescription className="text-xs">Listado de clientes activos en el sistema.</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                <Input placeholder="Buscar por nombre o documento..." className="h-10 border-slate-200 bg-white w-80 pl-9 text-sm rounded-xl focus:ring-accent" value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] tracking-tight text-slate-400 font-bold uppercase">
                  {!isHidden("cli_razon_social") && <th className="px-8 py-4">Razón Social</th>}
                  {!isHidden("cli_nro_doc") && <th className="px-8 py-4">Documento</th>}
                  {(!isHidden("cli_telefono") || !isHidden("cli_email")) && <th className="px-8 py-4">Contacto</th>}
                  <th className="px-8 py-4 text-center">Ubicaciones</th>
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={10} className="px-8 py-10 text-center text-slate-400 italic">Cargando clientes...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={10} className="px-8 py-10 text-center text-slate-400 italic">No se encontraron clientes.</td></tr>
                ) : currentItems.map((item) => (
                  <tr key={item.cli_id} className="hover:bg-slate-50/30 transition-colors">
                    {!isHidden("cli_razon_social") && (
                      <td className="px-8 py-4">
                         <div className="flex flex-col text-[14px]">
                           <span className="font-bold text-slate-700">{item.cli_razon_social}</span>
                           {!isHidden("cli_es_contribuyente") && item.cli_es_contribuyente && <span className="text-[10px] text-emerald-600 font-bold uppercase flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Contribuyente</span>}
                         </div>
                      </td>
                    )}
                    {!isHidden("cli_nro_doc") && (
                      <td className="px-8 py-4 font-mono text-[12px] text-slate-500">
                        <Badge variant="outline" className="bg-slate-100 border-none font-bold text-slate-600">
                          {item.cli_tip_doc_id}: {item.cli_nro_doc}
                        </Badge>
                      </td>
                    )}
                    {(!isHidden("cli_telefono") || !isHidden("cli_email")) && (
                      <td className="px-8 py-4 text-[12px] text-slate-400">
                         <div className="flex flex-col gap-1">
                           {!isHidden("cli_telefono") && <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {item.cli_telefono || '---'}</div>}
                           {!isHidden("cli_email") && <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {item.cli_email || '---'}</div>}
                         </div>
                      </td>
                    )}
                    <td className="px-8 py-4 text-center">
                       <Button onClick={() => openDirecciones(item)} variant="outline" size="sm" className="h-9 px-4 gap-2 border-accent/20 text-accent hover:bg-accent/5 font-bold rounded-xl transition-all">
                         <MapPin className="h-4 w-4" /> <span className="text-[11px] uppercase tracking-wider">Direcciones</span>
                       </Button>
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
          
          {/* Paginación Estandarizada */}
          {!loading && filteredData.length > 0 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                Mostrando <span className="text-slate-600 font-black">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="text-slate-600 font-black">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> de <span className="text-slate-600 font-black">{filteredData.length}</span> registros
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} title="Primero"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} title="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
                
                <div className="flex items-center gap-1 mx-2">
                  <Badge variant="secondary" className="h-8 w-8 flex items-center justify-center p-0 rounded-lg bg-accent/10 text-accent font-bold border-accent/20">
                    {currentPage}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-black uppercase px-1">de</span>
                  <span className="text-[10px] text-slate-400 font-black uppercase px-1">{totalPages || 1}</span>
                </div>

                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} title="Siguiente"><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} title="Último"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL CLIENTE */}
      <CustomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`${editingItem ? 'Editar' : 'Nuevo'} Cliente`}
        className="max-w-md shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-white/50 backdrop-blur-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {!isHidden("cli_es_contribuyente") && (
            <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
              <input 
                type="checkbox" 
                id="esContribuyente" 
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent accent-accent cursor-pointer" 
                checked={formData.esContribuyente} 
                onChange={(e) => setFormData({...formData, esContribuyente: e.target.checked})} 
                disabled={isReadOnly("cli_es_contribuyente")}
              />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="esContribuyente" className="text-sm font-bold leading-none cursor-pointer text-slate-700">¿Es Contribuyente?</label>
                <p className="text-xs text-slate-400 font-medium italic">Al marcar, el tipo de documento se fijará en RUC automáticamente.</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {!isHidden("cli_tip_doc_id") && (
              <div className="space-y-2 relative">
                <Label className="text-slate-700 font-bold">Tipo Documento</Label>
                <div className="relative">
                  <select 
                    className={`flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 font-medium focus:ring-2 focus:ring-accent outline-none shadow-sm ${(formData.esContribuyente || isReadOnly("cli_tip_doc_id")) ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`} 
                    value={formData.tipDocId} 
                    onChange={e => setFormData({...formData, tipDocId: e.target.value})} 
                    required 
                    disabled={formData.esContribuyente || isReadOnly("cli_tip_doc_id")}
                  >
                    <option value="">Seleccione...</option>{tipoDocs.map(t => <option key={t.tip_doc_id} value={t.tip_doc_id}>{t.tip_doc_dsc}</option>)}
                  </select>
                  {(formData.esContribuyente || isReadOnly("cli_tip_doc_id")) && <Lock className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />}
                </div>
              </div>
            )}
            {!isHidden("cli_nro_doc") && (
              <div className="space-y-2">
                <Label className="text-slate-700 font-bold">Nro. Documento</Label>
                <Input 
                  value={formData.nroDoc} 
                  onChange={e => setFormData({...formData, nroDoc: e.target.value})} 
                  placeholder="Ej: 1234567" 
                  required 
                  className="h-12 border-slate-200 text-slate-950 font-medium bg-white shadow-sm" 
                  disabled={isReadOnly("cli_nro_doc")}
                />
              </div>
            )}
          </div>
          {!isHidden("cli_es_contribuyente") && formData.esContribuyente && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
              <Label className="text-accent font-bold">RUC Resultante (Base + DV)</Label>
              <div className="flex gap-2">
                <div className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center px-4 font-mono text-sm text-slate-900 shadow-inner">{formData.nroDoc || "---"}</div>
                <div className="w-12 h-10 bg-accent text-white border border-accent rounded-xl flex items-center justify-center font-bold shadow-lg">-{rucDV || '0'}</div>
              </div>
            </div>
          )}
          {!isHidden("cli_razon_social") && (
            <div className="space-y-2">
              <Label className="text-slate-700 font-bold">Razón Social / Nombre Completo</Label>
              <Input 
                value={formData.razonSocial} 
                onChange={e => setFormData({...formData, razonSocial: e.target.value})} 
                placeholder="Ingrese el nombre..." 
                required 
                className="h-12 border-slate-200 text-slate-950 font-medium bg-white shadow-sm" 
                disabled={isReadOnly("cli_razon_social")}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {!isHidden("cli_telefono") && (
              <div className="space-y-2">
                <Label className="text-slate-700 font-bold">Teléfono</Label>
                <Input 
                  value={formData.telefono} 
                  onChange={e => setFormData({...formData, telefono: e.target.value})} 
                  placeholder="+595 ..." 
                  className="h-12 border-slate-200 text-slate-950 font-medium bg-white shadow-sm" 
                  disabled={isReadOnly("cli_telefono")}
                />
              </div>
            )}
            {!isHidden("cli_email") && (
              <div className="space-y-2">
                <Label className="text-slate-700 font-bold">Correo</Label>
                <Input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="ejemplo@mail.com" 
                  className="h-12 border-slate-200 text-slate-950 font-medium bg-white shadow-sm" 
                  disabled={isReadOnly("cli_email")}
                />
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-6">
            <Button type="submit" className="flex-1 bg-accent text-white font-bold h-12 rounded-2xl shadow-lg flex gap-2 uppercase tracking-tighter"><Save className="h-4 w-4" /> Guardar</Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-tighter text-slate-500">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      {/* MODAL GESTIÓN DE DIRECCIONES */}
      <CustomModal 
        isOpen={isDirModalOpen} 
        onClose={() => setIsDirModalOpen(false)} 
        title={`Direcciones de Entrega: ${selectedCliente?.cli_razon_social}`}
        className="max-w-6xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-white/50 backdrop-blur-xl"
      >
        <div className="space-y-6 pt-2 max-w-6xl mx-auto">
          {!isAddressFormOpen ? (
            <>
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                     <MapIcon className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="font-bold text-slate-700 leading-tight text-sm">Ubicaciones Registradas</p>
                     <p className="text-[10px] text-slate-400 italic font-medium">Gestiona los puntos de entrega para este cliente.</p>
                   </div>
                </div>
                <Button onClick={openAddAddress} className="bg-accent text-white font-bold h-10 px-6 rounded-xl shadow-lg shadow-accent/20">
                  <PlusCircle className="h-4 w-4 mr-2" /> Agregar Dirección
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {direcciones.length === 0 ? (
                  <div className="col-span-2 py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 italic">
                    No hay direcciones registradas para este cliente.
                  </div>
                ) : direcciones.map((dir, idx) => (
                  <Card key={dir.dir_id} className="border border-slate-100 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group">
                    <div className="p-4 flex gap-4">
                       <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                             <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] uppercase">
                               #{idx + 1} • {barrios.find(b => b.bar_cod === dir.dir_bar_cod)?.bar_dsc || 'Barrio'}
                             </Badge>
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => openEditAddress(dir)}><Edit3 className="h-3 w-3" /></Button>
                               <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg text-red-500 border-transparent hover:bg-red-50" onClick={() => deleteAddress(dir.dir_id)}><Trash2 className="h-3 w-3" /></Button>
                             </div>
                          </div>
                          <p className="font-bold text-slate-700 text-sm leading-snug">{dir.dir_calle_principal} {dir.dir_nro_casa}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1"><Navigation className="h-3 w-3" /> {dir.lat}, {dir.lng}</p>
                          {dir.zon_id && (
                            <Badge className="bg-accent/5 text-accent border-accent/10 font-bold text-[9px] uppercase tracking-widest">
                               Zona: {zonas.find(z => z.zon_id === dir.zon_id)?.zon_nombre}
                            </Badge>
                          )}
                       </div>
                       {dir.dir_foto_url && (
                         <div 
                           className="w-20 h-20 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-50 relative group cursor-pointer"
                           onClick={() => setFullImage(dir.dir_foto_url)}
                         >
                            <img src={dir.dir_foto_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Foto Dirección" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <ExternalLink className="h-4 w-4 text-white" />
                            </div>
                         </div>
                       )}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={handleAddressSubmit} className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    {editingAddress ? <Edit3 className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                    {editingAddress ? 'Editar Dirección' : 'Nueva Dirección de Entrega'}
                  </h3>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setIsAddressFormOpen(false)} className="rounded-full h-8 w-8"><X className="h-4 w-4" /></Button>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-bold">Departamento / Ciudad / Barrio</Label>
                      <div className="grid grid-cols-2 gap-2">
                         <select className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-950 font-medium focus:ring-2 focus:ring-accent outline-none shadow-sm" value={addressData.barDepCod} onChange={e => setAddressData({...addressData, barDepCod: e.target.value})}>
                           <option value="">DEPARTAMENTO</option>
                           {deps.map(d => <option key={d.dep_cod} value={d.dep_cod}>{d.dep_dsc}</option>)}
                         </select>
                         <select className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-950 font-medium focus:ring-2 focus:ring-accent outline-none shadow-sm" value={addressData.barDisCod} onChange={e => setAddressData({...addressData, barDisCod: e.target.value})} disabled={!addressData.barDepCod}>
                           <option value="">DISTRITO</option>
                           {distritos.filter(d => d.dis_dep_cod === parseInt(addressData.barDepCod)).map(d => <option key={d.dis_cod} value={d.dis_cod}>{d.dis_dsc}</option>)}
                         </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                         <select className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-950 font-medium focus:ring-2 focus:ring-accent outline-none shadow-sm" value={addressData.barCiuCod} onChange={e => setAddressData({...addressData, barCiuCod: e.target.value})} disabled={!addressData.barDisCod}>
                           <option value="">CIUDAD</option>
                           {ciudades.filter(c => c.ciu_dep_cod === parseInt(addressData.barDepCod) && c.ciu_dis_cod === parseInt(addressData.barDisCod)).map(c => <option key={c.ciu_cod} value={c.ciu_cod}>{c.ciu_dsc}</option>)}
                         </select>
                         <select className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-950 font-medium focus:ring-2 focus:ring-accent outline-none shadow-sm" value={addressData.barCod} onChange={e => setAddressData({...addressData, barCod: e.target.value})} disabled={!addressData.barCiuCod} required>
                           <option value="">BARRIO</option>
                           {barrios.filter(b => b.bar_dep_cod === parseInt(addressData.barDepCod) && b.bar_dis_cod === parseInt(addressData.barDisCod) && b.bar_ciu_cod === parseInt(addressData.barCiuCod)).map(b => <option key={b.bar_cod} value={b.bar_cod}>{b.bar_dsc}</option>)}
                         </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-slate-700 font-bold">Zona Logística (Opcional)</Label>
                       <select className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 font-medium focus:ring-2 focus:ring-accent outline-none shadow-sm" value={addressData.zonId} onChange={e => setAddressData({...addressData, zonId: e.target.value})}>
                          <option value="">Ninguna</option>
                          {zonas.map(z => <option key={z.zon_id} value={z.zon_id}>{z.zon_nombre}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-slate-700 font-bold">Calle Principal y Nro. Casa</Label>
                       <div className="flex gap-2">
                          <Input className="h-12 flex-[3] border-slate-200 text-slate-950 font-medium bg-white shadow-sm" value={addressData.calle} onChange={e => setAddressData({...addressData, calle: e.target.value})} placeholder="Ej: Avda. España" required />
                          <Input className="h-12 flex-1 border-slate-200 text-slate-950 font-medium bg-white shadow-sm" value={addressData.nroCasa} onChange={e => setAddressData({...addressData, nroCasa: e.target.value})} placeholder="Nº 123" />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                       <Label className="flex justify-between items-center text-slate-700 font-bold">
                         <span>Geolocalización (Punto en Mapa)</span>
                         <Badge variant="outline" className="text-[9px] font-mono">{addressData.lat.toFixed(4)}, {addressData.lng.toFixed(4)}</Badge>
                       </Label>
                       <PointMap 
                         lat={addressData.lat} 
                         lng={addressData.lng} 
                         onChange={(lat: number, lng: number) => setAddressData({...addressData, lat, lng})} 
                       />
                    </div>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold">Referencia para el repartidor</Label>
                    <Input value={addressData.referencia} onChange={e => setAddressData({...addressData, referencia: e.target.value})} placeholder="Ej: Portón verde..." className="h-12 border-slate-200 text-slate-950 font-medium bg-white shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold">Foto de Fachada (Adjuntar archivo)</Label>
                    <div className="flex gap-3">
                       <input 
                         type="file" 
                         id="fotoFachada" 
                         className="hidden" 
                         accept="image/*" 
                         onChange={async (e) => {
                           const file = e.target.files?.[0];
                           if (file) {
                             // 1. ELIMINAR FOTO PREVIA SI EXISTE PARA NO ACUMULAR BASURA
                             if (addressData.fotoUrl) {
                               try {
                                 await fetch("/api/upload", {
                                   method: "DELETE",
                                   body: JSON.stringify({ url: addressData.fotoUrl }),
                                   headers: { "Content-Type": "application/json" }
                                 });
                               } catch (err) {
                                 console.error("Error eliminando foto previa:", err);
                               }
                             }

                             const formData = new FormData();
                             formData.append("file", file);
                             formData.append("cliDoc", selectedCliente?.cli_nro_doc || "unknown");
                             formData.append("dirId", editingAddress?.dir_id || "new");
                             
                             showToast("Actualizando imagen...");
                             try {
                               const res = await fetch("/api/upload", {
                                 method: "POST",
                                 body: formData
                               });
                               const json = await res.json();
                               if (json.url) {
                                 setAddressData({ ...addressData, fotoUrl: json.url });
                                 showToast("Imagen actualizada con éxito");
                               }
                             } catch (err) {
                               console.error(err);
                               showToast("Error al subir nueva imagen");
                             }
                           }
                         }}
                       />
                       <Button 
                         type="button" 
                         variant="outline" 
                         className="flex-1 h-11 border-dashed border-2 border-slate-200 hover:border-accent hover:bg-accent/5 gap-2 text-slate-500"
                         onClick={() => document.getElementById('fotoFachada')?.click()}
                       >
                         {addressData.fotoUrl ? <ImageIcon className="h-4 w-4 text-emerald-500" /> : <PlusCircle className="h-4 w-4" />}
                         {addressData.fotoUrl ? 'Cambiar Foto' : 'Seleccionar Imagen'}
                       </Button>
                       
                       {addressData.fotoUrl && (
                         <div 
                           className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-white relative group cursor-pointer"
                           onClick={() => setFullImage(addressData.fotoUrl)}
                         >
                            <img src={addressData.fotoUrl} className="w-full h-full object-cover" alt="Preview" />
                            <div 
                              className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteImage(addressData.fotoUrl);
                              }}
                            >
                               <Trash2 className="h-4 w-4 text-white" />
                            </div>
                         </div>
                       )}
                       
                       <Input 
                         className="flex-1 h-11 border-slate-200 text-slate-950 font-medium bg-white shadow-sm" 
                         value={addressData.fotoDsc} 
                         onChange={e => setAddressData({...addressData, fotoDsc: e.target.value})} 
                         placeholder="Ej: Portón azul..." 
                       />
                    </div>
                  </div>
               </div>
               <div className="flex gap-3 pt-4 border-t border-slate-200 mt-6">
                  <Button type="submit" className="flex-1 bg-accent text-white font-bold h-11 rounded-xl shadow-lg flex gap-2 uppercase tracking-tighter"><Save className="h-4 w-4" /> Guardar Ubicación</Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddressFormOpen(false)} className="flex-1 h-11 rounded-xl font-bold uppercase tracking-tighter text-slate-500">Cancelar</Button>
               </div>
            </form>
          )}
        </div>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={async () => {
      if (!itemToDelete) return;
      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const tenantId = user?.tenantId || "public";

      const res = await fetch(`/api/clientes/${itemToDelete.cli_id}`, { 
        method: "DELETE",
        headers: {
          "x-tenant-id": tenantId,
          "x-user-email": user?.email || "",
          "x-user-profile": user?.perfil_cod?.toString() || ""
        }
      });
      if (res.ok) { setIsConfirmOpen(false); showToast("Cliente desactivado"); fetchData(); }
      }} title="¿Desactivar Cliente?" description="El cliente pasará a estado INACTIVO." />

      <ConfirmModal isOpen={isAddrConfirmOpen} onClose={() => setIsAddrConfirmOpen(false)} onConfirm={async () => {
        if (!addrToDelete) return;
        
        // 1. LIMPIEZA DE ARCHIVO FÍSICO SI EXISTE
        const dir = direcciones.find(d => d.dir_id === addrToDelete);
        if (dir?.dir_foto_url) {
          try {
            await fetch("/api/upload", {
              method: "DELETE",
              body: JSON.stringify({ url: dir.dir_foto_url }),
              headers: { "Content-Type": "application/json" }
            });
          } catch (err) {
            console.error("No se pudo borrar el archivo al eliminar dirección:", err);
          }
        }

        // 2. ELIMINACIÓN EN BASE DE DATOS
        const res = await fetch(`/api/clientes/${selectedCliente.cli_id}/direcciones/${addrToDelete}`, { method: "DELETE" });
        if (res.ok) { setIsAddrConfirmOpen(false); showToast("Dirección eliminada"); fetchDirecciones(selectedCliente.cli_id); }
      }} title="¿Eliminar Dirección?" description="Esta acción no se puede deshacer." />

      {/* VISOR DE IMAGEN FULL SCREEN */}
      {fullImage && (
        <div 
          className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 cursor-zoom-out"
          onClick={() => setFullImage(null)}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-6 right-6 text-white hover:bg-white/10 rounded-full h-12 w-12"
            onClick={() => setFullImage(null)}
          >
            <X className="h-8 w-8" />
          </Button>
          <div className="max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-300">
             <img 
               src={fullImage} 
               className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/10" 
               alt="Vista Previa Full" 
             />
          </div>
        </div>
      )}
    </div>
  );
}
