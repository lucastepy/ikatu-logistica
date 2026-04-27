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
  MapPin, 
  Phone, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Save, 
  Search,
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Store,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Sucursal {
  suc_id: number;
  suc_nombre: string;
  suc_direccion: string | null;
  suc_telefono: string | null;
  suc_estado: string | null;
  _count: {
    usuarios: number;
  };
}

export default function SucursalPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Sucursal | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    estado: "A"
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sucursales");
      const data = await res.json();
      setSucursales(Array.isArray(data) ? data : []);
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
    setFormData({ nombre: "", direccion: "", telefono: "", estado: "A" });
    setIsModalOpen(true);
  };

  const openEdit = (item: Sucursal) => {
    setEditingItem(item);
    setFormData({ 
      nombre: item.suc_nombre, 
      direccion: item.suc_direccion || "", 
      telefono: item.suc_telefono || "", 
      estado: item.suc_estado || "A" 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/admin/sucursales/${editingItem.suc_id}` : "/api/admin/sucursales";

    const res = await fetch(url, {
      method,
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      setIsModalOpen(false);
      showToast(editingItem ? "Sucursal actualizada" : "Sucursal creada");
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
    const res = await fetch(`/api/admin/sucursales/${itemToDelete}`, { method: "DELETE" });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Sucursal eliminada");
      fetchData();
    } else {
      const err = await res.json();
      showToast(err.error || "Error al eliminar");
    }
  };

  // Filtrado
  const filteredSucursales = sucursales.filter(s => 
    s.suc_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.suc_direccion || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Lógica de Paginación
  const totalPages = Math.ceil(filteredSucursales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSucursales = filteredSucursales.slice(startIndex, startIndex + itemsPerPage);

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
          <h1 className="text-3xl font-bold tracking-tight text-accent">Sucursales</h1>
          <p className="text-muted mt-1">Administra los puntos logísticos y centros de distribución.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold shadow-lg flex gap-2">
          <Plus className="h-4 w-4" /> Nueva Sucursal
        </Button>
      </div>

      <Card className="bg-card border-border shadow-xl overflow-hidden">
        <CardHeader className="border-b bg-background/50 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Red de Sucursales</CardTitle>
              <CardDescription>Puntos habilitados para la gestión de carga y usuarios.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted opacity-50" />
              <Input 
                placeholder="Buscar sucursal o dirección..." 
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
                  <th className="px-6 py-4">Sucursal / Dirección</th>
                  <th className="px-6 py-4 text-center">Usuarios</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted italic">Cargando sucursales...</td></tr>
                ) : currentSucursales.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted italic">No se encontraron sucursales.</td></tr>
                ) : currentSucursales.map((item) => (
                  <tr key={item.suc_id} className="hover:bg-background/40 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-muted">#{item.suc_id.toString().padStart(3, '0')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/5 text-accent border border-accent/10">
                          <Store className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground leading-none mb-1">{item.suc_nombre}</p>
                          <div className="flex items-center gap-1 text-[11px] text-muted font-medium italic">
                            <MapPin className="h-3 w-3" /> {item.suc_direccion || "Sin dirección"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] gap-1 px-2.5">
                         <Users className="h-3 w-3" /> {item._count?.usuarios || 0}
                       </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={`font-black uppercase text-[9px] tracking-tight ${item.suc_estado === 'A' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                        {item.suc_estado === 'A' ? 'ACTIVO' : 'INACTIVO'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 gap-2 border-slate-200 hover:bg-slate-50 transition-all px-3 font-bold text-xs shadow-sm text-slate-600">
                          <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" /> Editar
                        </Button>
                        <Button onClick={() => handleDeleteClick(item.suc_id)} variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 border-transparent hover:bg-red-50 transition-all">
                          <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                        </Button>
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
                Mostrando <span className="text-foreground font-bold">{filteredSucursales.length > 0 ? startIndex + 1 : 0}</span> a <span className="text-foreground font-bold">{Math.min(startIndex + itemsPerPage, filteredSucursales.length)}</span> de <span className="text-foreground font-bold">{filteredSucursales.length}</span> sucursales
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(1)} disabled={currentPage === 1 || totalPages <= 1} title="Primero"><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || totalPages <= 1} title="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
                
                <div className="flex items-center gap-1 mx-2">
                  <Badge variant="secondary" className="h-8 w-8 flex items-center justify-center p-0 rounded-lg bg-accent/10 text-accent font-bold border-accent/20 shadow-sm">
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

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Editar Sucursal" : "Nueva Sucursal"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nombre de la Sucursal</Label>
            <div className="relative">
              <Input 
                value={formData.nombre} 
                onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                placeholder="Ej: Sucursal Central Asunción"
                className="pl-9"
                required 
                autoFocus
              />
              <Store className="absolute left-3 top-2.5 h-4 w-4 text-muted opacity-40" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <div className="relative">
                <Input 
                  value={formData.telefono} 
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
                  placeholder="+595 ..."
                  className="pl-9"
                />
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted opacity-40" />
              </div>
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

          <div className="space-y-2">
            <Label>Dirección Física</Label>
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

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-accent text-white font-bold gap-2 shadow-lg"><Save className="h-4 w-4" /> {editingItem ? "Actualizar" : "Guardar Sucursal"}</Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title="¿Eliminar Sucursal?" description="Esta acción es permanente. Solo se podrá eliminar si no existen usuarios vinculados." />
    </div>
  );
}
