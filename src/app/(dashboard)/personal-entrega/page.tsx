"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CustomModal } from "@/components/ui/dialog-custom";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { 
  Plus, 
  User, 
  Truck, 
  CreditCard, 
  Calendar, 
  Phone, 
  MapPin, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight
} from "lucide-react";

interface TipoPersonal {
  tip_per_ent_id: number;
  tip_per_ent_dsc: string;
}

interface PersonalEntrega {
  per_ent_documento: string;
  per_ent_nombre: string;
  per_ent_tipo: number;
  per_ent_licencia: string | null;
  per_ent_cat_licencia: string | null;
  per_ent_vto_licencia: string | null;
  per_ent_telefono: string | null;
  per_ent_direccion: string | null;
  per_ent_estado: string;
  tipo: TipoPersonal;
}

export default function PersonalEntregaPage() {
  const [personal, setPersonal] = useState<PersonalEntrega[]>([]);
  const [tipos, setTipos] = useState<TipoPersonal[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<PersonalEntrega | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    documento: "",
    nombre: "",
    tipo: "",
    licencia: "",
    cat_licencia: "",
    vto_licencia: "",
    telefono: "",
    direccion: "",
    estado: "A"
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resP, resT] = await Promise.all([
        fetch("/api/admin/personal-entrega"),
        fetch("/api/admin/tipo-personal-entrega")
      ]);
      const dataP = await resP.json();
      const dataT = await resT.json();
      
      setPersonal(Array.isArray(dataP) ? dataP : []);
      setTipos(Array.isArray(dataT) ? dataT : []);
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
      documento: "", 
      nombre: "", 
      tipo: "", 
      licencia: "", 
      cat_licencia: "", 
      vto_licencia: "", 
      telefono: "", 
      direccion: "", 
      estado: "A" 
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: PersonalEntrega) => {
    setEditingItem(item);
    setFormData({ 
      documento: item.per_ent_documento, 
      nombre: item.per_ent_nombre, 
      tipo: item.per_ent_tipo.toString(), 
      licencia: item.per_ent_licencia || "", 
      cat_licencia: item.per_ent_cat_licencia || "", 
      vto_licencia: item.per_ent_vto_licencia ? item.per_ent_vto_licencia.split('T')[0] : "", 
      telefono: item.per_ent_telefono || "", 
      direccion: item.per_ent_direccion || "", 
      estado: item.per_ent_estado 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem 
      ? `/api/admin/personal-entrega/${editingItem.per_ent_documento}` 
      : "/api/admin/personal-entrega";

    // Obtener el usuario logueado
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const usuarioPk = user?.id?.toString() || "SISTEMA";

    const res = await fetch(url, {
      method,
      body: JSON.stringify({ ...formData, usuario: usuarioPk }),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      setIsModalOpen(false);
      showToast(editingItem ? "Registro actualizado" : "Personal registrado");
      fetchData();
    } else {
      const err = await res.json();
      showToast(err.error || "Error al procesar");
    }
  };

  const handleDeleteClick = (doc: string) => {
    setDocToDelete(doc);
    setIsConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!docToDelete) return;
    const res = await fetch(`/api/admin/personal-entrega/${docToDelete}`, { method: "DELETE" });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Registro eliminado");
      fetchData();
    }
  };

  // Lógica de Paginación
  const totalPages = Math.ceil(personal.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = personal.slice(startIndex, startIndex + itemsPerPage);

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
          <h1 className="text-3xl font-bold tracking-tight text-accent">Personal de Entrega</h1>
          <p className="text-muted mt-1">Gestión de choferes, ayudantes y personal de logística.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold shadow-lg flex gap-2">
          <Plus className="h-4 w-4" /> Nuevo Personal
        </Button>
      </div>

      <Card className="bg-card border-border shadow-xl overflow-hidden">
        <CardHeader className="border-b bg-background/50">
          <CardTitle className="text-lg">Directorio de Personal</CardTitle>
          <CardDescription>Visualiza y administra los datos del personal operativo.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-background/30 text-xs uppercase tracking-widest text-muted font-bold">
                  <th className="px-6 py-4">Documento / Nombre</th>
                  <th className="px-6 py-4">Tipo / Cargo</th>
                  <th className="px-6 py-4">Licencia</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted italic">Cargando personal...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted italic">No hay personal registrado.</td></tr>
                ) : currentItems.map((item) => (
                  <tr key={item.per_ent_documento} className="hover:bg-background/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/5 text-accent border border-accent/10">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground leading-none mb-1">{item.per_ent_nombre}</p>
                          <div className="flex items-center gap-1 text-[11px] text-muted font-medium uppercase tracking-tighter">
                            <CreditCard className="h-3 w-3" /> DOC: {item.per_ent_documento}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className="px-2.5 py-1 rounded-md bg-blue-500/5 text-blue-600 border border-blue-500/10 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <Truck className="h-3 w-3" /> {item.tipo?.tip_per_ent_dsc}
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.per_ent_licencia ? (
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-slate-600">Cat: {item.per_ent_cat_licencia}</div>
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                            <Calendar className="h-3 w-3" />
                            Vence: {(() => {
                              if (!item.per_ent_vto_licencia) return 'N/A';
                              const d = new Date(item.per_ent_vto_licencia);
                              const day = d.getUTCDate().toString().padStart(2, '0');
                              const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
                              const year = d.getUTCFullYear();
                              return `${day}/${month}/${year}`;
                            })()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-bold uppercase italic">Sin licencia</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={`font-black uppercase text-[9px] tracking-tighter ${item.per_ent_estado === 'A' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                        {item.per_ent_estado === 'A' ? 'ACTIVO' : 'INACTIVO'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 gap-2 border-border hover:bg-background group-hover:border-accent group-hover:text-accent transition-all px-3 font-bold text-xs uppercase tracking-tighter">
                          <Edit3 className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button onClick={() => handleDeleteClick(item.per_ent_documento)} variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 border-transparent hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button>
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
                Mostrando <span className="text-foreground font-bold">{personal.length > 0 ? startIndex + 1 : 0}</span> a <span className="text-foreground font-bold">{Math.min(startIndex + itemsPerPage, personal.length)}</span> de <span className="text-foreground font-bold">{personal.length}</span> registros
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

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Editar Personal" : "Registrar Personal"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Documento de Identidad</Label>
              <Input 
                value={formData.documento} 
                onChange={(e) => setFormData({...formData, documento: e.target.value})} 
                disabled={!!editingItem}
                required 
                autoFocus={!editingItem}
                placeholder="Ej: 1234567"
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input 
                value={formData.nombre} 
                onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                required 
                autoFocus={!!editingItem}
                placeholder="Nombre del funcionario"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Personal / Cargo</Label>
              <select 
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.tipo}
                onChange={e => setFormData({...formData, tipo: e.target.value})}
                required
              >
                <option value="">Seleccionar tipo...</option>
                {tipos.map(t => <option key={t.tip_per_ent_id} value={t.tip_per_ent_id}>{t.tip_per_ent_dsc}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Teléfono de Contacto</Label>
              <div className="relative">
                <Input 
                  value={formData.telefono} 
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
                  placeholder="09xx xxx xxx"
                />
                <Phone className="absolute right-3 top-2.5 h-4 w-4 text-muted opacity-30" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>N° Licencia</Label>
              <Input 
                value={formData.licencia} 
                onChange={(e) => setFormData({...formData, licencia: e.target.value})} 
                placeholder="Ej: 456789"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Input 
                value={formData.cat_licencia} 
                onChange={(e) => setFormData({...formData, cat_licencia: e.target.value})} 
                placeholder="Ej: Profesional A"
              />
            </div>
            <div className="space-y-2">
              <Label>Vencimiento</Label>
              <Input 
                type="date"
                value={formData.vto_licencia} 
                onChange={(e) => setFormData({...formData, vto_licencia: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Dirección Particular</Label>
              <div className="relative">
                <Input 
                  value={formData.direccion} 
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})} 
                  placeholder="Calle, Ciudad..."
                />
                <MapPin className="absolute right-3 top-2.5 h-4 w-4 text-muted opacity-30" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <select 
                className={`flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${!editingItem ? 'bg-slate-50 opacity-70 cursor-not-allowed' : ''}`}
                value={formData.estado}
                onChange={e => setFormData({...formData, estado: e.target.value})}
                disabled={!editingItem}
              >
                <option value="A">Activo</option>
                <option value="I">Inactivo</option>
              </select>
              {!editingItem && <p className="text-[10px] text-muted italic">Los nuevos registros se crean activos por defecto.</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="submit" className="flex-1 bg-accent text-white font-bold gap-2 uppercase tracking-tight"><Save className="h-4 w-4" /> {editingItem ? "Actualizar" : "Guardar Registro"}</Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 font-bold uppercase tracking-tight">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title="¿Eliminar Registro?" description="Esta acción borrará permanentemente los datos del personal." />
    </div>
  );
}
