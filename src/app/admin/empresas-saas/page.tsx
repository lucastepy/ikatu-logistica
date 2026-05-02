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
  Building2, 
  Hash, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Save, 
  Search,
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Briefcase,
  Store,
  AlertTriangle,
  Layers,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Empresa {
  cli_saas_cod: number;
  cli_saas_nom: string | null;
  cli_saas_nom_fan: string | null;
  cli_saas_ruc: string | null;
  cli_saas_estado: string | null;
  cli_saas_mail: string | null;
  cli_saas_dir: string | null;
  cli_saas_tel: string | null;
  cli_saas_propietario: string | null;
  cli_saas_tenant: string | null;
  cli_saas_plan_id: number | null;
  plan?: {
    pla_nom: string;
  };
}

interface Plan {
  pla_id: number;
  pla_nom: string;
}

export default function EmpresaPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Empresa | null>(null);
  const [availableSchemas, setAvailableSchemas] = useState<string[]>([]);
  const [planesList, setPlanesList] = useState<Plan[]>([]);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    nombre: "",
    nombre_fan: "",
    ruc: "",
    estado: "A",
    mail: "",
    direccion: "",
    telefono: "",
    propietario: "",
    tenant: "",
    plan_id: "" as string | number,
    initInfra: false,
    sourceSchema: ""
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resE, resS, resP] = await Promise.all([
        fetch("/api/admin/empresas"),
        fetch("/api/admin/listas/schemas"),
        fetch("/api/admin/planes")
      ]);
      const dataE = await resE.json();
      const dataS = await resS.json();
      const dataP = await resP.json();
      
      setEmpresas(Array.isArray(dataE) ? dataE : []);
      setAvailableSchemas(Array.isArray(dataS) ? dataS.filter(s => s !== 'public') : []);
      setPlanesList(Array.isArray(dataP) ? dataP : []);
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

  // Lógica de generación automática de Tenant ID
  useEffect(() => {
    if (!editingItem) { // Solo autocompletar si es nuevo
      const slug = formData.nombre
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      
      setFormData(prev => ({ 
        ...prev, 
        tenant: slug ? `tenant_${slug}` : "" 
      }));
    }
  }, [formData.nombre, editingItem]);

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ 
      nombre: "", 
      nombre_fan: "",
      ruc: "", 
      estado: "A", 
      mail: "", 
      direccion: "", 
      telefono: "", 
      propietario: "", 
      tenant: "",
      plan_id: "",
      initInfra: false,
      sourceSchema: "" // Reset to empty
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: Empresa) => {
    setEditingItem(item);
    setFormData({ 
      nombre: item.cli_saas_nom || "", 
      nombre_fan: item.cli_saas_nom_fan || "",
      ruc: item.cli_saas_ruc || "", 
      estado: item.cli_saas_estado || "A", 
      mail: item.cli_saas_mail || "", 
      direccion: item.cli_saas_dir || "", 
      telefono: item.cli_saas_tel || "", 
      propietario: item.cli_saas_propietario || "",
      tenant: item.cli_saas_tenant || "",
      plan_id: item.cli_saas_plan_id || "",
      initInfra: false,
      sourceSchema: ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.mail && !emailRegex.test(formData.mail)) {
      showToast("El formato del correo electrónico no es válido", 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const method = editingItem ? "PUT" : "POST";
      const url = editingItem ? `/api/admin/empresas/${editingItem.cli_saas_cod}` : "/api/admin/empresas";

      const res = await fetch(url, {
        method,
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        setIsModalOpen(false);
        showToast(editingItem ? "Empresa actualizada" : "Empresa creada", 'success');
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Error al procesar", 'error');
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
    const res = await fetch(`/api/admin/empresas/${itemToDelete}`, { method: "DELETE" });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Empresa eliminada", 'success');
      fetchData();
    } else {
      const err = await res.json();
      showToast(err.error || "Error al eliminar", 'error');
    }
  };

  // Filtrado
  const filteredEmpresas = empresas.filter(e => 
    (e.cli_saas_nom?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (e.cli_saas_nom_fan?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (e.cli_saas_ruc || "").includes(searchTerm)
  );

  // Lógica de Paginación
  const totalPages = Math.ceil(filteredEmpresas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEmpresas = filteredEmpresas.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 relative min-h-screen">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-8 duration-300">
          <div className={`bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'border-emerald-500/20' : 'border-red-500/20'} backdrop-blur-xl bg-opacity-90`}>
            <div className={`${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} p-1 rounded-full text-white`}>
              {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            </div>
            <span className="font-bold text-sm tracking-tight">{toast.msg}</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-white">Gestión de <span className="text-red-500">Empresas</span></h1>
          <p className="text-slate-400 mt-1 font-medium">Directorio corporativo y configuración de razones sociales Multi-Tenant.</p>
        </div>
        <Button onClick={openCreate} className="bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/20 flex gap-2 rounded-xl transition-all active:scale-95">
          <Plus className="h-4 w-4" /> Nueva Empresa
        </Button>
      </div>

      <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-800 bg-slate-950/20 space-y-4 p-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-bold text-white">Empresas Registradas</CardTitle>
              <CardDescription className="text-slate-500">Visualiza y administra las compañías del ecosistema.</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 opacity-50" />
              <Input 
                placeholder="Buscar por nombre o RUC..." 
                className="pl-10 h-10 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-400 rounded-xl focus-visible:ring-red-500/50"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/30 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                  <th className="px-6 py-4 w-20">ID</th>
                  <th className="px-6 py-4">Empresa / RUC</th>
                  <th className="px-6 py-4">Tenant / Plan</th>
                  <th className="px-6 py-4">Contacto / Email</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic font-medium">Cargando directorio empresarial...</td></tr>
                ) : currentEmpresas.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic font-medium">No se encontraron empresas.</td></tr>
                ) : currentEmpresas.map((item) => (
                  <tr key={item.cli_saas_cod} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-600 font-bold">#{item.cli_saas_cod}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 leading-none mb-1 group-hover:text-white transition-colors tracking-tight">{item.cli_saas_nom}</p>
                          <div className="flex items-center gap-2">
                             <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold italic">
                                <Hash className="h-3 w-3" /> {item.cli_saas_ruc}
                             </div>
                             {item.cli_saas_nom_fan && (
                               <Badge variant="outline" className="text-[9px] py-0 h-4 bg-slate-800/50 text-slate-400 border-slate-700 font-bold">
                                 {item.cli_saas_nom_fan}
                               </Badge>
                             )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="space-y-1.5">
                          <code className="text-[10px] font-mono bg-slate-950/50 text-red-400/80 px-2 py-0.5 rounded border border-red-500/10 block w-fit">
                            {item.cli_saas_tenant || "N/A"}
                          </code>
                          <div className="flex items-center gap-1.5">
                            <Layers className="h-3 w-3 text-slate-500" />
                            <span className={`text-[10px] font-black tracking-tighter uppercase ${item.plan ? 'text-amber-500/80' : 'text-slate-600 italic'}`}>
                              {item.plan?.pla_nom || "Sin Plan"}
                            </span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 group-hover:text-slate-300">
                          <Mail className="h-3.5 w-3.5 text-slate-600" />
                          {item.cli_saas_mail || "-"}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 pl-5 uppercase tracking-tighter">
                          <Phone className="h-3 w-3" />
                          {item.cli_saas_tel || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={`font-black uppercase text-[9px] tracking-widest px-2 py-0.5 border-2 ${item.cli_saas_estado === 'A' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {item.cli_saas_estado === 'A' ? 'ACTIVO' : 'INACTIVO'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 gap-2 border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all px-3 font-bold text-[10px] uppercase tracking-tighter">
                          <Edit3 className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button 
                          onClick={() => handleDeleteClick(item.cli_saas_cod)} 
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
          
          {/* Paginación Estandarizada */}
          {!loading && filteredEmpresas.length > 0 && (
            <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/20">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Mostrando <span className="text-white font-black">{startIndex + 1}</span> a <span className="text-white font-black">{Math.min(startIndex + itemsPerPage, filteredEmpresas.length)}</span> de <span className="text-white font-black">{filteredEmpresas.length}</span> registros
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400" onClick={() => goToPage(1)} disabled={currentPage === 1} title="Primero"><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} title="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
                
                <div className="flex items-center gap-1 mx-2">
                  <Badge variant="secondary" className="h-8 px-3 flex items-center justify-center p-0 rounded-lg bg-red-500/10 text-red-500 font-black border-red-500/20 text-xs">
                    {currentPage}
                  </Badge>
                  <span className="text-[10px] text-slate-600 font-black uppercase px-1">de</span>
                  <span className="text-[10px] text-slate-600 font-black uppercase px-1">{totalPages || 1}</span>
                </div>
 
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} title="Siguiente"><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} title="Último"><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? "Editar Empresa" : "Alta de Nueva Empresa"}
        description="Configure la identidad y provisión del inquilino."
        icon={Building2}
        className="max-w-4xl"
        variant="dark"
      >
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Fila 1: Nombre y RUC */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-2">
              <Label className="text-white font-bold text-xs tracking-widest">Nombre de la Empresa / Razón Social</Label>
              <div className="relative">
                <Input 
                  value={formData.nombre} 
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Ej: Ikatu Logística S.A."
                  className="pl-9 bg-slate-950 border-slate-800 text-white focus:ring-red-500/50 rounded-xl"
                  required 
                  autoFocus
                />
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-600 opacity-40" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white font-bold text-xs tracking-widest">RUC</Label>
              <Input 
                value={formData.ruc} 
                onChange={(e) => setFormData({...formData, ruc: e.target.value})} 
                placeholder="Ej: 80012345-0"
                className="bg-slate-950 border-slate-800 text-white focus:ring-red-500/50 rounded-xl"
                required 
              />
            </div>
          </div>

          {/* Fila 2: Fantasía y Estado */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-2">
              <Label className="text-white font-bold text-xs tracking-widest">Nombre Fantasía</Label>
              <div className="relative">
                <Input 
                  value={formData.nombre_fan} 
                  onChange={(e) => setFormData({...formData, nombre_fan: e.target.value})} 
                  placeholder="Ej: Ikatu Express"
                  className="pl-9 bg-slate-950 border-slate-800 text-white focus:ring-red-500/50 rounded-xl"
                />
                <Store className="absolute left-3 top-2.5 h-4 w-4 text-slate-600 opacity-40" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white font-bold text-xs tracking-widest">Estado Actual</Label>
              <select 
                className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-red-500/50 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.estado}
                onChange={e => setFormData({...formData, estado: e.target.value})}
                disabled={!editingItem}
              >
                <option value="A" className="bg-slate-900">Activo</option>
                <option value="I" className="bg-slate-900">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Fila 3: Tenant ID y Plan */}
          <div className="grid grid-cols-3 gap-4 items-start">
            <div className="space-y-2 col-span-2">
              <Label className="text-white font-bold text-xs uppercase tracking-widest text-red-500/80">Tenant ID (Automático)</Label>
              <div className="flex gap-4 items-center">
                <Input 
                  value={formData.tenant} 
                  readOnly
                  placeholder="tenant_ejemplo"
                  className="bg-slate-950/30 border-slate-800 text-red-500/60 font-mono text-xs cursor-not-allowed rounded-xl flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white font-bold text-xs tracking-widest">Plan Comercial</Label>
              <select 
                className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-red-500/50 focus:outline-none transition-all"
                value={formData.plan_id}
                onChange={e => setFormData({...formData, plan_id: e.target.value})}
              >
                <option value="" className="bg-slate-900 text-slate-500">Seleccionar Plan...</option>
                {planesList.map(p => (
                  <option key={p.pla_id} value={p.pla_id} className="bg-slate-900">{p.pla_nom}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-px bg-slate-800/50 w-full" />

          {/* Fila 4: Contacto y Ubicación */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
             <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white font-bold text-xs tracking-widest flex items-center gap-2">
                    Email usuario administrador
                    <div className="text-slate-500 cursor-help group/info" title="Es el correo del administrador del sistema">
                      <div className="bg-slate-800/50 p-0.5 rounded-full">
                        <Plus className="h-3 w-3 rotate-45" /> {/* Usando un plus rotado como x o info simple si no quiero importar más */}
                      </div>
                    </div>
                  </Label>
                  <Input 
                    type="email"
                    value={formData.mail} 
                    onChange={(e) => setFormData({...formData, mail: e.target.value})} 
                    className="bg-slate-950 border-slate-800 text-white focus:ring-red-500/50 rounded-xl"
                    placeholder="contacto@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white font-bold text-xs tracking-widest">Teléfono</Label>
                  <Input 
                    value={formData.telefono} 
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
                    className="bg-slate-950 border-slate-800 text-white focus:ring-red-500/50 rounded-xl"
                    placeholder="+595 ..."
                  />
                </div>
             </div>

             <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white font-bold text-xs tracking-widest">Dirección</Label>
                  <div className="relative">
                    <Input 
                      value={formData.direccion} 
                      onChange={(e) => setFormData({...formData, direccion: e.target.value})} 
                      placeholder="Calle, Nro, Referencia..."
                      className="pl-9 bg-slate-950 border-slate-800 text-white focus:ring-red-500/50 rounded-xl"
                    />
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-600 opacity-40" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white font-bold text-xs tracking-widest">Propietario / Representante</Label>
                  <div className="relative">
                    <Input 
                      value={formData.propietario} 
                      onChange={(e) => setFormData({...formData, propietario: e.target.value})} 
                      placeholder="Nombre del titular"
                      className="pl-9 bg-slate-950 border-slate-800 text-white focus:ring-red-500/50 rounded-xl"
                    />
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-600 opacity-40" />
                  </div>
                </div>
             </div>
          </div>

          <div className="h-px bg-slate-800/50 w-full" />

          {/* Bloque de Inicialización de Infraestructura (Último Campo) */}
          {!editingItem ? (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center h-6">
                   <input 
                     type="checkbox"
                     id="initInfra"
                     checked={formData.initInfra}
                     onChange={e => setFormData({...formData, initInfra: e.target.checked})}
                     className="h-5 w-5 rounded-md bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500/50 cursor-pointer"
                   />
                </div>
                <div className="space-y-1 flex-1">
                  <Label htmlFor="initInfra" className="text-amber-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer">
                    <AlertTriangle className="h-4 w-4" /> Inicializar Infraestructura Automatizada
                  </Label>
                  <p className="text-slate-500 text-[10px] font-bold leading-relaxed italic">
                    Esta opción ejecutará el provisionamiento (CREATE SCHEMA y creación de tablas base).
                  </p>
                </div>
              </div>

              {formData.initInfra && (
                <div className="space-y-2 pt-2 animate-in slide-in-from-top-2 duration-300 border-t border-amber-500/10">
                  <Label className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Esquema Origen (Master Data)</Label>
                  <select 
                    className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-white focus:ring-2 focus:ring-amber-500/50 focus:outline-none transition-all"
                    value={formData.sourceSchema}
                    onChange={e => setFormData({...formData, sourceSchema: e.target.value})}
                  >
                    <option value="" className="bg-slate-900">-- Seleccionar Origen --</option>
                    {availableSchemas.map(s => (
                      <option key={s} value={s} className="bg-slate-900">Origen: {s}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-950/20 border border-slate-800/50 border-dashed rounded-2xl p-4 flex items-center justify-center gap-3">
              <div className="h-2 w-2 rounded-full bg-slate-700 animate-pulse" />
              <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest italic">La infraestructura ya se encuentra provisionada para este Tenant</p>
            </div>
          )}

          <div className="flex gap-3 pt-6">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold gap-2 rounded-xl transition-all active:scale-95 py-6 uppercase tracking-widest text-xs disabled:opacity-70 disabled:scale-100">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? "Guardando..." : (editingItem ? "Actualizar" : "Guardar Empresa")}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1 border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl h-12 uppercase tracking-widest text-xs transition-all active:scale-95"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title="¿Eliminar Empresa?" description="Esta acción es permanente. Solo se podrá eliminar si no existen usuarios vinculados a esta razón social." variant="dark" />
    </div>
  );
}
