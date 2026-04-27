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
  Store
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Empresa {
  empresa_cod: number;
  empresa_nom: string | null;
  empresa_nom_fan: string | null;
  empresa_ruc: string | null;
  empresa_estado: string | null;
  empresa_mail: string | null;
  empresa_dir: string | null;
  empresa_tel: string | null;
  empresa_propietario: string | null;
  empresa_act_eco: number | null;
  empresa_dep: number | null;
  actividad?: { act_eco_dsc: string } | null;
  departamento?: { dep_dsc: string } | null;
}

export default function EmpresaPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [auxiliares, setAuxiliares] = useState({ actividades: [], departamentos: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Empresa | null>(null);
  
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
    act_eco: "",
    dep: ""
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resE, resA] = await Promise.all([
        fetch("/api/admin/empresas"),
        fetch("/api/admin/auxiliares")
      ]);
      const dataE = await resE.json();
      const dataA = await resA.json();
      
      setEmpresas(Array.isArray(dataE) ? dataE : []);
      setAuxiliares(dataA);
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
      act_eco: "", 
      dep: "" 
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: Empresa) => {
    setEditingItem(item);
    setFormData({ 
      nombre: item.empresa_nom || "", 
      nombre_fan: item.empresa_nom_fan || "",
      ruc: item.empresa_ruc || "", 
      estado: item.empresa_estado || "A", 
      mail: item.empresa_mail || "", 
      direccion: item.empresa_dir || "", 
      telefono: item.empresa_tel || "", 
      propietario: item.empresa_propietario || "", 
      act_eco: item.empresa_act_eco?.toString() || "", 
      dep: item.empresa_dep?.toString() || "" 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/admin/empresas/${editingItem.empresa_cod}` : "/api/admin/empresas";

    const res = await fetch(url, {
      method,
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      setIsModalOpen(false);
      showToast(editingItem ? "Empresa actualizada" : "Empresa creada");
      fetchData();
    } else {
      const err = await res.json();
      showToast(err.error || "Error al procesar");
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
      showToast("Empresa eliminada");
      fetchData();
    } else {
      const err = await res.json();
      showToast(err.error || "Error al eliminar");
    }
  };

  // Filtrado
  const filteredEmpresas = empresas.filter(e => 
    (e.empresa_nom?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (e.empresa_nom_fan?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (e.empresa_ruc || "").includes(searchTerm)
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
    <div className="p-8 space-y-8 animate-in fade-in duration-500 relative">
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
          <h1 className="text-3xl font-bold tracking-tight text-accent">Gestión de Empresa</h1>
          <p className="text-muted mt-1">Directorio corporativo y configuración de razones sociales.</p>
        </div>
        {!loading && empresas.length === 0 && (
          <Button onClick={openCreate} className="bg-accent text-white font-bold shadow-lg flex gap-2">
            <Plus className="h-4 w-4" /> Nueva Empresa
          </Button>
        )}
      </div>

      <Card className="bg-card border-border shadow-xl overflow-hidden">
        <CardHeader className="border-b bg-background/50 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Empresas Registradas</CardTitle>
              <CardDescription>Visualiza y administra las compañías del grupo.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted opacity-50" />
              <Input 
                placeholder="Buscar por nombre o RUC..." 
                className="pl-10 h-9"
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
                <tr className="border-b border-border bg-background/30 text-xs uppercase tracking-widest text-muted font-bold">
                  <th className="px-6 py-4 w-20">ID</th>
                  <th className="px-6 py-4">Empresa / RUC</th>
                  <th className="px-6 py-4">Contacto / Email</th>
                  <th className="px-6 py-4">Actividad / Ubicación</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-muted italic">Cargando directorio empresarial...</td></tr>
                ) : currentEmpresas.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-muted italic">No se encontraron empresas.</td></tr>
                ) : currentEmpresas.map((item) => (
                  <tr key={item.empresa_cod} className="hover:bg-background/40 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-muted">#{item.empresa_cod}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/5 text-accent border border-accent/10">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground leading-none mb-1">{item.empresa_nom}</p>
                          <div className="flex items-center gap-2">
                             <div className="flex items-center gap-1 text-[11px] text-muted font-medium italic">
                                <Hash className="h-3 w-3" /> {item.empresa_ruc}
                             </div>
                             {item.empresa_nom_fan && (
                               <Badge variant="outline" className="text-[9px] py-0 h-4 bg-slate-50 text-slate-500 border-slate-200">
                                 {item.empresa_nom_fan}
                               </Badge>
                             )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {item.empresa_mail || "-"}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 pl-5">
                          <Phone className="h-3 w-3" />
                          {item.empresa_tel || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-tighter text-blue-600">
                          <Briefcase className="h-3 w-3" />
                          {item.actividad?.act_eco_dsc || "Sin actividad"}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                          <MapPin className="h-3 w-3" />
                          {item.departamento?.dep_dsc || "Sin ubicación"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={`font-black uppercase text-[9px] tracking-tight ${item.empresa_estado === 'A' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                        {item.empresa_estado === 'A' ? 'ACTIVO' : 'INACTIVO'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 gap-2 border-border hover:bg-background group-hover:border-accent group-hover:text-accent transition-all px-3 font-bold text-xs">
                          <Edit3 className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button onClick={() => handleDeleteClick(item.empresa_cod)} variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 border-transparent hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Paginación */}
          {!loading && (
            <div className="flex items-center justify-between px-6 py-4 bg-background/50 border-t border-border">
              <p className="text-xs text-muted font-medium">
                Mostrando <span className="text-foreground font-bold">{filteredEmpresas.length > 0 ? startIndex + 1 : 0}</span> a <span className="text-foreground font-bold">{Math.min(startIndex + itemsPerPage, filteredEmpresas.length)}</span> de <span className="text-foreground font-bold">{filteredEmpresas.length}</span> empresas
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(1)} disabled={currentPage === 1 || totalPages <= 1} title="Primero"><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || totalPages <= 1} title="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
                
                <div className="flex items-center gap-1 mx-2">
                  <Badge variant="secondary" className="h-8 w-8 flex items-center justify-center p-0 rounded-lg bg-accent/10 text-accent font-bold border-accent/20">
                    {currentPage}
                  </Badge>
                  <span className="text-xs text-muted font-bold px-1">de</span>
                  <span className="text-xs text-muted font-bold px-1">{totalPages || 1}</span>
                </div>

                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || totalPages <= 1} title="Siguiente"><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages || totalPages <= 1} title="Último"><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Editar Empresa" : "Registrar Nueva Empresa"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Nombre de la Empresa / Razón Social</Label>
              <div className="relative">
                <Input 
                  value={formData.nombre} 
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Ej: Ikatu Logística S.A."
                  className="pl-9"
                  required 
                  autoFocus
                />
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted opacity-40" />
              </div>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Nombre Fantasía</Label>
              <div className="relative">
                <Input 
                  value={formData.nombre_fan} 
                  onChange={(e) => setFormData({...formData, nombre_fan: e.target.value})} 
                  placeholder="Ej: Ikatu Express"
                  className="pl-9"
                />
                <Store className="absolute left-3 top-2.5 h-4 w-4 text-muted opacity-40" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>RUC</Label>
              <Input 
                value={formData.ruc} 
                onChange={(e) => setFormData({...formData, ruc: e.target.value})} 
                placeholder="Ej: 80012345-0"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <select 
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.estado}
                onChange={e => setFormData({...formData, estado: e.target.value})}
              >
                <option value="A">Activo</option>
                <option value="I">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email Corporativo</Label>
              <Input 
                type="email"
                value={formData.mail} 
                onChange={(e) => setFormData({...formData, mail: e.target.value})} 
                placeholder="contacto@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input 
                value={formData.telefono} 
                onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
                placeholder="+595 ..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dirección</Label>
            <div className="relative">
              <Input 
                value={formData.direccion} 
                onChange={(e) => setFormData({...formData, direccion: e.target.value})} 
                placeholder="Calle, Nro, Referencia..."
                className="pl-9"
              />
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted opacity-40" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Actividad Económica</Label>
              <select 
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.act_eco}
                onChange={e => setFormData({...formData, act_eco: e.target.value})}
              >
                <option value="">Seleccionar...</option>
                {auxiliares.actividades.map((a: any) => (
                  <option key={a.act_eco_cod} value={a.act_eco_cod}>{a.act_eco_dsc}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Departamento</Label>
              <select 
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.dep}
                onChange={e => setFormData({...formData, dep: e.target.value})}
              >
                <option value="">Seleccionar...</option>
                {auxiliares.departamentos.map((d: any) => (
                  <option key={d.dep_cod} value={d.dep_cod}>{d.dep_dsc}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Propietario / Representante</Label>
            <div className="relative">
              <Input 
                value={formData.propietario} 
                onChange={(e) => setFormData({...formData, propietario: e.target.value})} 
                placeholder="Nombre del titular"
                className="pl-9"
              />
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted opacity-40" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-accent text-white font-bold gap-2"><Save className="h-4 w-4" /> {editingItem ? "Actualizar" : "Guardar Empresa"}</Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title="¿Eliminar Empresa?" description="Esta acción es permanente. Solo se podrá eliminar si no existen usuarios vinculados a esta razón social." />
    </div>
  );
}
