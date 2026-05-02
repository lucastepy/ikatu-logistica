"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Search, Edit3, Trash2, Save, X, Layers, 
  DollarSign, BarChart3, Clock, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Info, AlertCircle, Trash,
  PlusCircle, ArrowRight, Settings2, Coins, Loader2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CustomModal } from "@/components/ui/dialog-custom";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { CheckCircle2 } from "lucide-react";

interface MatrizTier {
  mat_id?: number;
  desde: number;
  hasta: number | null;
  valor: number;
  es_porcentaje: boolean;
}

interface Componente {
  comp_id?: number;
  nombre: string;
  tipo: 'FIJO' | 'POR_TRANSACCION';
  monto: number;
  recurrencia: string;
  matriz: MatrizTier[];
}

interface Plan {
  pla_id: number;
  pla_nom: string;
  pla_desc: string | null;
  pla_tipo_cobro: string;
  pla_moneda: number | null;
  pla_est: boolean;
  moneda?: {
    moneda_nom: string;
    moneda_sim: string | null;
  };
  componentes: Componente[];
}

// Componente auxiliar para inputs monetarios con soporte de decimales y miles
function CurrencyInput({ value, onChange, className, placeholder }: { 
  value: number, 
  onChange: (val: number) => void, 
  className?: string,
  placeholder?: string 
}) {
  const formatNumber = (num: number | string) => {
    if (num === null || num === undefined || num === "") return "";
    const n = Number(num);
    if (isNaN(n)) return "";
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(n);
  };

  const [displayValue, setDisplayValue] = useState(formatNumber(value));

  useEffect(() => {
    // Solo actualizar el display si el valor externo cambia y no estamos editando (o si el valor numérico difiere)
    const formatted = formatNumber(value);
    if (parseFloat(displayValue.replace(/\./g, '').replace(',', '.')) !== value) {
      setDisplayValue(formatted);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Permitir solo números, puntos de miles y UNA coma decimal
    if (/^[0-9.,]*$/.test(raw)) {
      setDisplayValue(raw);
      
      // Intentar parsear para el estado real
      const clean = raw.replace(/\./g, '').replace(',', '.');
      const num = clean === "" ? 0 : parseFloat(clean);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  const handleBlur = () => {
    setDisplayValue(formatNumber(value));
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
    />
  );
}

export default function PlanesPage() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Plan | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [monedas, setMonedas] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const formatNumber = (num: number | string) => {
    if (num === null || num === undefined || num === "") return "";
    const n = Number(num);
    if (isNaN(n)) return "";
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(n);
  };

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    tipo_cobro: "RECURRENTE",
    moneda_id: "" as string | number,
    estado: true,
    componentes: [] as Componente[]
  });

  useEffect(() => {
    fetchPlanes();
    fetchMonedas();
  }, []);

  const fetchMonedas = async () => {
    try {
      const res = await fetch("/api/admin/monedas");
      const data = await res.json();
      setMonedas(data);
    } catch (error) {
      console.error("Error loading monedas:", error);
    }
  };

  const fetchPlanes = async () => {
    try {
      const res = await fetch("/api/admin/planes");
      const data = await res.json();
      setPlanes(data);
    } catch (error) {
      showToast("Error al cargar planes");
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingItem(null);
    setFormData({
      nombre: "",
      descripcion: "",
      tipo_cobro: "RECURRENTE",
      moneda_id: "",
      estado: true,
      componentes: []
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: Plan) => {
    setEditingItem(item);
    setFormData({
      nombre: item.pla_nom,
      descripcion: item.pla_desc || "",
      tipo_cobro: item.pla_tipo_cobro,
      moneda_id: item.pla_moneda || "",
      estado: item.pla_est,
      componentes: item.componentes.map(c => ({
        comp_id: c.comp_id,
        nombre: c.comp_nom,
        tipo: c.comp_tipo as 'FIJO' | 'POR_TRANSACCION',
        monto: Number(c.comp_monto),
        recurrencia: c.comp_recurrencia,
        matriz: c.matriz.map(m => ({
          mat_id: m.mat_id,
          desde: m.mat_desde,
          hasta: m.mat_hasta,
          valor: Number(m.mat_valor),
          es_porcentaje: m.mat_es_porcentaje
        }))
      }))
    });
    setIsModalOpen(true);
  };

  const addComponente = () => {
    setFormData({
      ...formData,
      componentes: [...formData.componentes, {
        nombre: "",
        tipo: "FIJO",
        monto: 0,
        recurrencia: "MENSUAL",
        matriz: []
      }]
    });
  };

  const removeComponente = (index: number) => {
    const newComps = [...formData.componentes];
    newComps.splice(index, 1);
    setFormData({ ...formData, componentes: newComps });
  };

  const updateComponente = (index: number, field: keyof Componente, value: any) => {
    const newComps = [...formData.componentes];
    newComps[index] = { ...newComps[index], [field]: value };
    setFormData({ ...formData, componentes: newComps });
  };

  const addTier = (compIndex: number) => {
    const newComps = [...formData.componentes];
    const comp = newComps[compIndex];
    const lastTier = comp.matriz[comp.matriz.length - 1];
    const nextDesde = lastTier ? (lastTier.hasta || 0) + 1 : 1;
    
    comp.matriz.push({
      desde: nextDesde,
      hasta: null,
      valor: 0,
      es_porcentaje: false
    });
    setFormData({ ...formData, componentes: newComps });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingItem ? `/api/admin/planes/${editingItem.pla_id}` : "/api/admin/planes";
      const method = editingItem ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        showToast(editingItem ? "Plan actualizado" : "Plan creado");
        setIsModalOpen(false);
        fetchPlanes();
      } else {
        showToast("Error al guardar");
      }
    } catch (error) {
      showToast("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDelete = (id: number) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/planes/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Plan eliminado");
        fetchPlanes();
      } else {
        showToast("Error al eliminar");
      }
    } catch (error) {
      showToast("Error de conexión");
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const filteredData = planes.filter(p => 
    p.pla_nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

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
          <h1 className="text-3xl font-extrabold tracking-tighter text-white">Configurador de <span className="text-red-500">Planes</span></h1>
          <p className="text-slate-400 mt-1 font-medium">Modelos de negocio, costos fijos y esquemas de comisiones transaccionales.</p>
        </div>
        <Button onClick={openNew} className="bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/20 flex gap-2 rounded-xl transition-all active:scale-95">
          <Plus className="h-4 w-4" /> Nuevo Plan
        </Button>
      </div>

      <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-800 bg-slate-950/20 space-y-4 p-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-bold text-white">Modelos de Negocio</CardTitle>
              <CardDescription className="text-slate-500">Visualiza y administra los planes comerciales del sistema.</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 opacity-50" />
              <Input 
                placeholder="Buscar plan..." 
                className="pl-10 h-10 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-400 rounded-xl focus-visible:ring-red-500/50 h-10 font-bold text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/30 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                  <th className="px-6 py-4 w-20 text-center">ID</th>
                  <th className="px-6 py-4">Nombre del Plan</th>
                  <th className="px-6 py-4 text-center">Moneda</th>
                  <th className="px-6 py-4">Tipo de Cobro</th>
                  <th className="px-6 py-4 text-center">Componentes</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic font-medium">Cargando modelos...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic font-medium">No se encontraron planes.</td></tr>
                ) : currentItems.map((item) => (
                  <tr key={item.pla_id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-4 text-center font-mono text-[10px] text-slate-600 font-bold">#{item.pla_id}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-200 leading-none mb-1 group-hover:text-white transition-colors tracking-tight">{item.pla_nom}</p>
                        <p className="text-[10px] text-slate-500 italic truncate max-w-xs">{item.pla_desc || "Sin descripción"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-black text-amber-500">
                          {item.moneda?.moneda_sim || "$"}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{item.moneda?.moneda_nom || "Sin moneda"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="bg-slate-950/50 text-slate-400 border-slate-800 font-black text-[9px] tracking-widest">
                        {item.pla_tipo_cobro}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <Badge className="bg-red-500/10 text-red-500 border-red-500/20 font-black px-2">
                          {item.componentes.length} Ítems
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={`font-black uppercase text-[9px] tracking-widest px-2 py-0.5 border-2 ${item.pla_est ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {item.pla_est ? 'ACTIVO' : 'INACTIVO'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 gap-2 border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all px-3 font-bold text-[10px] uppercase tracking-tighter">
                          <Edit3 className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button 
                          onClick={() => openDelete(item.pla_id)} 
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

          <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/20">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
               Mostrando <span className="text-white font-black">{startIndex + 1}</span> a <span className="text-white font-black">{Math.min(startIndex + itemsPerPage, filteredData.length)}</span> de <span className="text-white font-black">{filteredData.length}</span> registros
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
        </CardContent>
      </Card>

      <CustomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? "Editar Modelo de Negocio" : "Configurar Nuevo Plan"}
        description="Defina la estructura de costos y escalones del plan comercial."
        icon={Layers}
        className="max-w-5xl"
        variant="dark"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <div className="space-y-2">
                <Label className="text-white font-bold text-xs tracking-widest">Nombre del Plan</Label>
                <Input 
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Ej: Plan Enterprise, Plan Startup..."
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-400 focus:ring-red-500/50 rounded-xl py-6 font-bold"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white font-bold text-xs tracking-widest">Descripción / Alcance</Label>
                <textarea 
                  value={formData.descripcion}
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 text-white placeholder:text-slate-400 rounded-xl p-4 text-sm focus:ring-2 focus:ring-red-500/50 focus:outline-none min-h-[100px] font-medium"
                  placeholder="Detalles sobre beneficios y límites..."
                />
              </div>
            </div>
            <div className="space-y-4">
               <div className="space-y-2">
                <Label className="text-white font-bold text-xs tracking-widest">Tipo de Facturación</Label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500/50"
                  value={formData.tipo_cobro}
                  onChange={e => setFormData({...formData, tipo_cobro: e.target.value})}
                >
                  <option value="">Seleccionar...</option>
                  <option value="UNICO">Pago Único</option>
                  <option value="RECURRENTE">Recurrente</option>
                  <option value="MIXTO">Modelo Mixto</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-white font-bold text-xs tracking-widest flex items-center gap-2">
                  <Coins className="h-3 w-3 text-red-500" /> Moneda del Plan
                </Label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500/50"
                  value={formData.moneda_id}
                  onChange={e => setFormData({...formData, moneda_id: e.target.value === "" ? "" : parseInt(e.target.value)})}
                  required
                >
                  <option value="">Seleccionar Moneda...</option>
                  {monedas.map(m => (
                    <option key={m.moneda_cod} value={m.moneda_cod}>
                      {m.moneda_nom} ({m.moneda_sim})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-white font-bold text-xs tracking-widest">Estado</Label>
                <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800 opacity-80">
                  <input 
                    type="checkbox" 
                    checked={formData.estado}
                    onChange={e => setFormData({...formData, estado: e.target.checked})}
                    disabled={!editingItem}
                    className="h-5 w-5 rounded bg-slate-900 border-slate-700 text-red-600 focus:ring-red-500 cursor-not-allowed"
                  />
                  <span className="text-xs font-black text-slate-300 tracking-widest">Plan Vigente</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white tracking-widest flex items-center gap-2">
                  <Layers className="h-4 w-4 text-red-500" /> Estructura de Costos y Componentes
                </h3>
                <Button type="button" onClick={addComponente} variant="outline" className="h-8 border-dashed border-slate-700 bg-slate-900/30 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">
                  <PlusCircle className="h-3.5 w-3.5 mr-1" /> Añadir Componente
                </Button>
             </div>

             <div className="space-y-4">
                {formData.componentes.map((comp, idx) => (
                  <div key={idx} className="bg-slate-950/30 border border-slate-800 rounded-2xl p-5 space-y-4 relative group/comp animate-in zoom-in-95 duration-200">
                    <button 
                      type="button"
                      onClick={() => removeComponente(idx)}
                      className="absolute top-4 right-4 text-slate-600 hover:text-red-500 transition-colors"
                    >
                      <Trash className="h-4 w-4" />
                    </button>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-slate-500 font-bold text-[10px]">Nombre Componente</Label>
                        <Input 
                          value={comp.nombre}
                          onChange={e => updateComponente(idx, 'nombre', e.target.value)}
                          className="bg-slate-950 border-slate-800 h-10 text-sm font-bold text-white placeholder:text-slate-400 focus:border-red-500/50"
                          placeholder="Ej: Licencia de Usuario..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-500 font-bold text-[10px]">Tipo de Costo</Label>
                        <select 
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg h-9 px-2 text-[11px] font-bold"
                          value={comp.tipo}
                          onChange={e => updateComponente(idx, 'tipo', e.target.value)}
                        >
                          <option value="FIJO">COSTO FIJO</option>
                          <option value="POR_TRANSACCION">ESCALONADO</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-500 font-bold text-[10px]">Recurrencia</Label>
                        <select 
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg h-9 px-2 text-[11px] font-bold"
                          value={comp.recurrencia}
                          onChange={e => updateComponente(idx, 'recurrencia', e.target.value)}
                        >
                          <option value="UNA_VEZ">Una Vez / Único</option>
                          <option value="SEMANAL">Semanal</option>
                          <option value="QUINCENAL">Quincenal</option>
                          <option value="MENSUAL">Mensual</option>
                          <option value="TRIMESTRAL">Trimestral</option>
                          <option value="SEMESTRAL">Semestral</option>
                          <option value="ANUAL">Anual</option>
                        </select>
                      </div>
                    </div>

                    {comp.tipo === 'FIJO' ? (
                      <div className="flex items-center gap-4 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        <div className="flex-1">
                          <Label className="text-slate-500 font-bold text-[9px]">Monto Base</Label>
                          <CurrencyInput 
                            value={comp.monto}
                            onChange={val => updateComponente(idx, 'monto', val)}
                            className="bg-transparent border-none p-0 h-auto text-white font-black text-2xl focus:ring-0 shadow-none w-full outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl">
                         <div className="flex items-center justify-between">
                            <Label className="text-amber-500 font-black text-[10px] tracking-widest flex items-center gap-2">
                              <BarChart3 className="h-3.5 w-3.5" /> Matriz Escalonada por Transacción
                            </Label>
                            <Button type="button" onClick={() => addTier(idx)} className="h-6 bg-amber-500 hover:bg-amber-400 text-black font-black text-[9px] uppercase tracking-tighter px-2 rounded">
                              + Rango
                            </Button>
                         </div>
                         <div className="space-y-2">
                            {comp.matriz.map((mat, mIdx) => (
                              <div key={mIdx} className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-3 flex items-center gap-2">
                                  <span className="text-[9px] text-slate-500 font-bold uppercase">De</span>
                                  <Input 
                                    type="number" 
                                    value={mat.desde ?? ""} 
                                    className="h-7 bg-slate-950 border-slate-800 text-[10px] font-bold text-center text-white focus:border-red-500/50"
                                    onChange={e => {
                                      const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                      if (!isNaN(val)) {
                                        const newMat = [...comp.matriz];
                                        newMat[mIdx].desde = val;
                                        updateComponente(idx, 'matriz', newMat);
                                      }
                                    }}
                                  />
                                </div>
                                <div className="col-span-3 flex items-center gap-2">
                                  <span className="text-[9px] text-slate-500 font-bold uppercase">A</span>
                                  <Input 
                                    type="number" 
                                    value={mat.hasta ?? ""} 
                                    placeholder="∞"
                                    className="h-7 bg-slate-950 border-slate-800 text-[10px] font-bold text-center text-white placeholder:text-slate-400 focus:border-red-500/50"
                                    onChange={e => {
                                      const val = e.target.value === "" ? null : parseInt(e.target.value);
                                      if (val === null || !isNaN(val)) {
                                        const newMat = [...comp.matriz];
                                        newMat[mIdx].hasta = val;
                                        updateComponente(idx, 'matriz', newMat);
                                      }
                                    }}
                                  />
                                </div>
                                <div className="col-span-3 flex items-center gap-2">
                                   <DollarSign className="h-3 w-3 text-slate-500" />
                                   <CurrencyInput 
                                    value={mat.valor} 
                                    onChange={val => {
                                      const newMat = [...comp.matriz];
                                      newMat[mIdx].valor = val;
                                      updateComponente(idx, 'matriz', newMat);
                                    }}
                                    className="h-8 bg-slate-950 border border-slate-800 rounded-md px-2 text-xs font-black text-amber-400 text-right focus:border-amber-500/50 outline-none w-full"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const newMat = [...comp.matriz];
                                      newMat[mIdx].es_porcentaje = !newMat[mIdx].es_porcentaje;
                                      updateComponente(idx, 'matriz', newMat);
                                    }}
                                    className={`text-[9px] font-black px-2 py-1 rounded border ${mat.es_porcentaje ? 'bg-amber-500 text-black border-amber-500' : 'text-slate-500 border-slate-800'}`}
                                  >
                                    {mat.es_porcentaje ? "% PORC" : "$ FIJO"}
                                  </button>
                                </div>
                                <div className="col-span-1 text-right">
                                   <button 
                                     type="button" 
                                     onClick={() => {
                                       const newMat = [...comp.matriz];
                                       newMat.splice(mIdx, 1);
                                       updateComponente(idx, 'matriz', newMat);
                                     }}
                                     className="text-slate-700 hover:text-red-500"
                                   >
                                     <X className="h-3.5 w-3.5" />
                                   </button>
                                </div>
                              </div>
                            ))}
                         </div>
                      </div>
                    )}
                  </div>
                ))}

                {formData.componentes.length === 0 && (
                  <div className="border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center">
                    <Layers className="h-12 w-12 text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">No hay componentes definidos</p>
                    <p className="text-slate-600 text-[10px] italic mt-1">Añade ítems para empezar a configurar el tarifario del plan.</p>
                  </div>
                )}
             </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold gap-2 rounded-xl transition-all active:scale-95 py-6 uppercase tracking-widest text-xs disabled:opacity-70 disabled:scale-100">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? "Guardando..." : (editingItem ? "Actualizar Modelo" : "Guardar Modelo de Negocio")}
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

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={onConfirmDelete} 
        title="¿Archivar Modelo?" 
        description="Esta acción eliminará el plan y todos sus componentes asociados. Los clientes vinculados a este plan podrían verse afectados." 
        variant="dark"
      />
    </div>
  );
}
