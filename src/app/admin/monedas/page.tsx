'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Coins,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Hash,
  Type,
  BadgeDollarSign,
  Save,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomModal } from "@/components/ui/dialog-custom";
import { ConfirmModal } from "@/components/ui/modal-confirm";

interface Moneda {
  moneda_cod: number;
  moneda_nom: string;
  moneda_sim: string | null;
}

export default function MonedasPage() {
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Moneda | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState<Partial<Moneda>>({
    moneda_nom: "",
    moneda_sim: "",
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMonedas = async () => {
    try {
      const res = await fetch('/api/admin/monedas');
      const data = await res.json();
      setMonedas(data);
    } catch (error) {
      showToast("Error al cargar monedas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonedas();
  }, []);

  const filteredMonedas = monedas.filter(m => 
    m.moneda_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.moneda_sim && m.moneda_sim.toLowerCase().includes(searchTerm.toLowerCase())) ||
    m.moneda_cod.toString().includes(searchTerm)
  );

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredMonedas.length / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredMonedas.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);

  const openAdd = () => {
    setEditingItem(null);
    setFormData({ moneda_nom: "", moneda_sim: "" });
    setIsModalOpen(true);
  };

  const openEdit = (item: Moneda) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setItemToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`/api/admin/monedas/${itemToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Moneda eliminada correctamente");
        fetchMonedas();
      }
      setIsConfirmOpen(false);
    } catch (error) {
      showToast("Error al eliminar moneda");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `/api/admin/monedas/${editingItem.moneda_cod}` : '/api/admin/monedas';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        showToast(editingItem ? "Cambios guardados" : "Moneda creada");
        setIsModalOpen(false);
        fetchMonedas();
      } else {
        const err = await res.json();
        showToast(err.error || "Error al guardar");
      }
    } catch (error) {
      showToast("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700 relative min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-8 duration-300">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/50 backdrop-blur-xl bg-opacity-90">
            <div className="bg-emerald-500 p-1 rounded-full text-white"><CheckCircle2 className="h-4 w-4" /></div>
            <span className="font-bold text-sm tracking-tight">{toast}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-white">Maestro de <span className="text-red-500">Monedas</span></h1>
          <p className="text-slate-400 mt-1 font-medium">Gestión de divisas y tipos de cambio del sistema.</p>
        </div>
        <Button onClick={openAdd} className="bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/20 flex gap-2 rounded-xl transition-all active:scale-95">
          <Plus className="h-4 w-4" /> Nueva Moneda
        </Button>
      </div>

      {/* Main Grid */}
      <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-800 bg-slate-950/20 space-y-4 p-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-bold text-white">Listado de Divisas</CardTitle>
              <CardDescription className="text-slate-500">Visualiza y administra las monedas habilitadas.</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 opacity-50" />
              <Input 
                placeholder="Buscar moneda..." 
                className="pl-10 h-10 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-400 rounded-xl focus-visible:ring-red-500/50 font-bold text-xs"
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
                  <th className="px-6 py-4">Nombre Moneda</th>
                  <th className="px-6 py-4 text-center">Símbolo / Sigla</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-6 h-16 bg-slate-900/10"></td>
                    </tr>
                  ))
                ) : currentItems.length > 0 ? (
                  currentItems.map((item) => (
                    <tr key={item.moneda_cod} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-6 py-4 text-center font-mono text-[10px] text-slate-600 font-bold">#{item.moneda_cod}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-red-500 group-hover:border-red-500/30 transition-all">
                            <Coins className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-slate-200 group-hover:text-white transition-colors tracking-tight">{item.moneda_nom}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-black text-amber-500 uppercase tracking-widest">
                          {item.moneda_sim || "---"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 gap-2 border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all px-3 font-bold text-[10px] uppercase tracking-tighter">
                            <Edit3 className="h-3.5 w-3.5" /> Editar
                          </Button>
                          <Button 
                            onClick={() => confirmDelete(item.moneda_cod)} 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-slate-600 border-slate-800 bg-slate-950/50 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                       <div className="flex flex-col items-center gap-3 text-slate-600">
                          <Coins className="h-12 w-12 opacity-20" />
                          <p className="font-medium">No se encontraron monedas</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && filteredMonedas.length > 0 && (
            <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/20">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Mostrando <span className="text-white font-black">{indexOfFirstItem + 1}</span> a <span className="text-white font-black">{Math.min(indexOfFirstItem + itemsPerPage, filteredMonedas.length)}</span> de <span className="text-white font-black">{filteredMonedas.length}</span> registros
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400" onClick={() => goToPage(1)} disabled={currentPage === 1} title="Primero"><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} title="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
                
                <div className="flex items-center gap-1 mx-2">
                  <span className="h-8 px-3 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 font-black border-red-500/20 text-xs">
                    {currentPage}
                  </span>
                  <span className="text-[10px] text-slate-600 font-black uppercase px-1">de</span>
                  <span className="text-[10px] text-slate-600 font-black uppercase px-1">{totalPages}</span>
                </div>

                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} title="Siguiente"><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} title="Último"><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <CustomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Editar Moneda" : "Nueva Moneda"}
        description="Defina las propiedades de la divisa para el tarifario."
        icon={Coins}
        className="max-w-lg"
        variant="dark"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white font-bold text-xs tracking-widest flex items-center gap-2 uppercase">
                <Type className="h-3 w-3 text-red-500" /> Nombre de la Moneda
              </Label>
              <Input 
                value={formData.moneda_nom}
                onChange={(e) => setFormData({...formData, moneda_nom: e.target.value})}
                placeholder="Ej: Guarani / Dólar"
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-400 focus:ring-red-500/50 rounded-xl py-6 font-bold"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white font-bold text-xs tracking-widest flex items-center gap-2 uppercase">
                <BadgeDollarSign className="h-3 w-3 text-red-500" /> Símbolo / Sigla
              </Label>
              <Input 
                value={formData.moneda_sim || ""}
                onChange={(e) => setFormData({...formData, moneda_sim: e.target.value.toUpperCase()})}
                placeholder="Ej: Gs / USD"
                maxLength={3}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-400 focus:ring-red-500/50 rounded-xl py-6 font-bold uppercase"
              />
              <p className="text-[10px] text-slate-500 italic px-1">Identificador de 3 caracteres máximo.</p>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-800">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold gap-2 rounded-xl transition-all active:scale-95 py-6 uppercase tracking-widest text-xs disabled:opacity-70 disabled:scale-100">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? "Guardando..." : (editingItem ? "Guardar Cambios" : "Crear Moneda")}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1 border-slate-800 bg-slate-950/50 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl py-6 uppercase tracking-widest text-xs transition-all active:scale-95"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CustomModal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar Moneda?"
        description="Esta acción eliminará la moneda permanentemente. Asegúrese de que no esté vinculada a planes activos."
        variant="dark"
      />
    </div>
  );
}
