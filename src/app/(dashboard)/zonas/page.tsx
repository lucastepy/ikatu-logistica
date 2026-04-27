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
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Save, 
  MapPin,
  Palette
} from "lucide-react";
import dynamic from "next/dynamic";

const PolygonMap = dynamic(() => import("@/components/maps/PolygonMap"), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 border border-dashed border-slate-300">Cargando Mapa Interactivo...</div>
});

export default function ZonasPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    nombre: "",
    color: "#3498db",
    poligono: null as any
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/zonas");
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
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
    setFormData({ nombre: "", color: "#3498db", poligono: null });
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ 
      nombre: item.zon_nombre, 
      color: item.zon_color,
      poligono: item.zon_poligono
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/admin/zonas/${editingItem.zon_id}` : "/api/admin/zonas";

    const res = await fetch(url, {
      method,
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      setIsModalOpen(false);
      showToast(editingItem ? "Zona actualizada" : "Zona creada");
      fetchData();
    } else {
      const err = await res.json();
      showToast(err.error || "Error al procesar");
    }
  };

  const handleDeleteClick = (item: any) => {
    setItemToDelete(item);
    setIsConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!itemToDelete) return;
    const res = await fetch(`/api/admin/zonas/${itemToDelete.zon_id}`, { method: "DELETE" });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Zona eliminada");
      fetchData();
    } else {
       const err = await res.json();
       showToast(err.error || "No se pudo eliminar");
    }
  };

  const filteredData = data.filter(item => 
    item.zon_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.zon_id.toString().includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-8 space-y-6 relative animate-in fade-in duration-500">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-8 duration-300">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/50 backdrop-blur-xl">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="font-bold text-sm tracking-tight">{toast}</span>
          </div>
        </div>
      )}

      {/* Header Premium */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Gestión de Zonas</h1>
          <p className="text-muted mt-1 font-medium italic">Configuración de áreas geográficas y perímetros operativos.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold hover:brightness-105 h-11 px-6 rounded-xl shadow-lg shadow-accent/20 transition-all">
          <Plus className="h-4 w-4 mr-2 stroke-[3]" /> Nueva Zona
        </Button>
      </div>

      <Card className="bg-card border-none shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
           <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-slate-700">Zonas Registradas</CardTitle>
                <CardDescription className="text-xs">Control de sectores para logística y distribución.</CardDescription>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                <Input placeholder="Buscar por nombre o ID..." className="h-9 border-slate-200 bg-white w-80 pl-9 text-sm rounded-xl focus:ring-accent" value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] tracking-tight text-slate-400 font-bold uppercase">
                  <th className="px-8 py-4 w-24 text-center">ID</th>
                  <th className="px-8 py-4">Nombre de la Zona</th>
                  <th className="px-8 py-4 text-center">Color</th>
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400 italic">Cargando catálogo...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400 italic">No se encontraron zonas.</td></tr>
                ) : currentItems.map((item) => (
                  <tr key={item.zon_id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-4 font-mono text-[11px] text-accent font-black text-center">#{item.zon_id}</td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-accent/5 text-accent">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <p className="font-bold text-slate-700 text-sm">{item.zon_nombre}</p>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center">
                       <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: item.zon_color }}></div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{item.zon_color}</span>
                       </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 gap-2 border-slate-200 hover:bg-slate-50 transition-all px-3 font-bold text-xs shadow-sm text-slate-600">
                           <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" /> Editar
                         </Button>
                         <Button onClick={() => handleDeleteClick(item)} variant="outline" size="icon" className="h-8 w-8 text-red-500 border-transparent hover:bg-red-50 transition-all">
                           <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                         </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/20">
             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total: {filteredData.length} registros</span>
             <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl font-bold" onClick={() => setCurrentPage(Math.max(1, currentPage-1))} disabled={currentPage===1}>Anterior</Button>
                <div className="flex items-center px-6 bg-white border border-slate-200 rounded-xl text-xs font-black text-accent shadow-inner">{currentPage} / {totalPages || 1}</div>
                <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl font-bold" onClick={() => setCurrentPage(Math.min(totalPages, currentPage+1))} disabled={currentPage===totalPages || totalPages === 0}>Siguiente</Button>
             </div>
          </div>
        </CardContent>
      </Card>

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Editar Zona" : "Nueva Zona"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nombre de la Zona</Label>
            <Input 
              value={formData.nombre} 
              onChange={e => setFormData({...formData, nombre: e.target.value})} 
              placeholder="Ej: Zona Norte, Centro, Sur..." 
              required 
              autoFocus 
            />
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2">Color de Identificación <Palette className="h-3 w-3 text-slate-300" /></Label>
            <div className="flex gap-3 items-center">
              <Input 
                type="color" 
                value={formData.color} 
                onChange={e => setFormData({...formData, color: e.target.value})} 
                className="w-16 h-10 p-1 rounded-lg cursor-pointer"
              />
              <Input 
                value={formData.color} 
                onChange={e => setFormData({...formData, color: e.target.value})} 
                className="font-mono uppercase"
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex justify-between items-center">
              <span>Perímetro de la Zona (Polígono)</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest bg-slate-100 px-2 py-0.5 rounded">PostGIS WGS84</span>
            </Label>
            <PolygonMap 
              initialGeoJSON={formData.poligono}
              color={formData.color}
              onPolygonChange={(geojson) => setFormData({ ...formData, poligono: geojson })}
            />
            <p className="text-[10px] text-slate-400 italic">Usa las herramientas de la derecha para dibujar un polígono en el mapa.</p>
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="submit" className="flex-1 bg-accent text-white font-bold h-12 rounded-2xl shadow-lg shadow-accent/20 flex gap-2 uppercase tracking-tighter"><Save className="h-4 w-4" /> Guardar Registro</Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-tighter text-slate-500">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title="¿Eliminar Zona?" description="Esta acción eliminará la definición de la zona. Asegúrese de que no haya perímetros vinculados de forma crítica." />
    </div>
  );
}
