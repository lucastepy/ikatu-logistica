"use client";

import React, { useEffect, useState, use } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit3, ChevronLeft, Save, ChevronDown, Circle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomModal } from "@/components/ui/dialog-custom";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import * as Icons from "lucide-react";
import Link from "next/link";

interface MenuDet {
  menu_cod: number;
  menu_det_cod: number;
  menu_det_nombre: string;
  menu_det_url: string | null;
  menu_det_icono: string | null;
  menu_det_cod_padre: number | null;
  menu_det_det_orden: number;
  menu_cargar_inicio: boolean;
  menu_det_estado: string | null;
}

export default function MenuDetallesPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const menuId = params.id;
  
  const [detalles, setDetalles] = useState<MenuDet[]>([]);
  const [menuNombre, setMenuNombre] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuDet | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [collapsedParents, setCollapsedParents] = useState<Set<number>>(new Set());
  const [isParentFixed, setIsParentFixed] = useState(false);

  const toggleCollapse = (id: number) => {
    const next = new Set(collapsedParents);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCollapsedParents(next);
  };

  const [formData, setFormData] = useState({
    nombre: "",
    url: "",
    icono: "",
    orden: "",
    parent: "",
    cargar_inicio: false,
    estado: "A"
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDetalles = () => {
    setLoading(true);
    // Cargar el nombre del menú
    fetch(`/api/admin/menus/${menuId}`)
      .then(res => res.json())
      .then(data => setMenuNombre(data.menu_nombre || ""));

    // Cargar los ítems
    fetch(`/api/admin/menus/${menuId}/detalles`)
      .then(res => res.json())
      .then(data => {
        setDetalles(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDetalles();
  }, [menuId]);

  const handleOpenCreate = (parentId?: number) => {
    setEditingItem(null);
    setIsParentFixed(true);
    setFormData({ 
      nombre: "", 
      url: "", 
      icono: "", 
      orden: (detalles.length + 1).toString(), 
      parent: parentId?.toString() || "" ,
      cargar_inicio: false,
      estado: "A"
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuDet) => {
    setEditingItem(item);
    setIsParentFixed(false);
    setFormData({
      nombre: item.menu_det_nombre,
      url: item.menu_det_url || "",
      icono: item.menu_det_icono || "",
      orden: item.menu_det_det_orden.toString(),
      parent: item.menu_det_cod_padre?.toString() || "",
      cargar_inicio: item.menu_cargar_inicio || false,
      estado: item.menu_det_estado || "A"
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem 
      ? `/api/admin/menus/${menuId}/detalles/${editingItem.menu_det_cod}` 
      : `/api/admin/menus/${menuId}/detalles`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setIsModalOpen(false);
      showToast(editingItem ? "Ítem actualizado" : "Ítem creado");
      fetchDetalles();
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const res = await fetch(`/api/admin/menus/${menuId}/detalles/${itemToDelete}`, { method: "DELETE" });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Ítem eliminado");
      fetchDetalles();
    }
  };

  const getIcon = (name: string | null) => {
    if (!name) return <Circle className="h-3 w-3" />;
    const toPascalCase = (str: string) => str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    const IconComp = (Icons as any)[toPascalCase(name)] || (Icons as any)[name] || Icons.Circle;
    return <IconComp className="h-4 w-4" />;
  };

  const parentItems = detalles.filter(item => !item.menu_det_cod_padre).sort((a,b) => a.menu_det_det_orden - b.menu_det_det_orden);
  const childrenMap = detalles.reduce((acc: any, curr) => {
    if (curr.menu_det_cod_padre) {
      if (!acc[curr.menu_det_cod_padre]) acc[curr.menu_det_cod_padre] = [];
      acc[curr.menu_det_cod_padre].push(curr);
    }
    return acc;
  }, {});

  return (
    <div className="p-8 space-y-6 relative min-h-screen bg-slate-950/20">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-8 duration-300">
          <div className="bg-slate-900 border border-slate-700/50 backdrop-blur-xl px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl text-white font-bold text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {toast}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/menus">
            <Button variant="outline" size="sm" className="h-10 border-slate-800 bg-slate-950/50 text-slate-300 hover:text-white shadow-sm">
              <ChevronLeft className="h-4 w-4 mr-2" /> Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white decoration-accent/30 underline-offset-4">Detalle del Menú</h1>
            <p className="text-sm text-slate-400 font-mono">{menuNombre || menuId}</p>
          </div>
        </div>
        <Button onClick={() => handleOpenCreate()} className="bg-red-600 hover:bg-red-500 text-white font-bold h-10 px-6 rounded-xl shadow-lg shadow-red-600/20 transition-all uppercase tracking-tighter flex gap-2 active:scale-95">
          <Plus className="h-4 w-4 stroke-[3]" /> Agregar Item
        </Button>
      </div>

      <Card className="bg-slate-900/40 border border-slate-800 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-[11px] tracking-widest text-slate-500 font-black uppercase">
                  <th className="px-8 py-4 w-24 text-center">Orden</th>
                  <th className="px-8 py-4">Descripción del Menú</th>
                  <th className="px-8 py-4">URL / Ruta Destino</th>
                  <th className="px-8 py-4 text-center">Icono</th>
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic font-mono text-sm">Sincronizando estructura...</td></tr>
                ) : parentItems.map((parent) => {
                  const isCollapsed = collapsedParents.has(parent.menu_det_cod);
                  const children = (childrenMap[parent.menu_det_cod] || []).sort((a:any,b:any) => a.menu_det_det_orden - b.menu_det_det_orden);
                  
                  return (
                    <React.Fragment key={parent.menu_det_cod}>
                      <tr className="hover:bg-white/[0.02] group transition-colors cursor-pointer" onClick={() => toggleCollapse(parent.menu_det_cod)}>
                        <td className="px-8 py-4 font-mono text-[11px] text-amber-500 font-bold text-center">#{parent.menu_det_det_orden}</td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg text-slate-500 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}>
                              <ChevronDown className="h-4 w-4 stroke-[3]" />
                            </div>
                             <span className="font-bold text-slate-200 tracking-tight text-[15px] leading-none">{parent.menu_det_nombre}</span>
                            {parent.menu_cargar_inicio && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-black uppercase tracking-tighter h-5">INICIO</Badge>
                            )}
                            <Badge variant="outline" className={`text-[9px] h-4 font-black ${parent.menu_det_estado === 'I' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                              {parent.menu_det_estado === 'I' ? 'OFF' : 'ON'}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-xs font-mono text-slate-500">{parent.menu_det_url || "—"}</td>
                        <td className="px-8 py-4 text-center"><div className="flex justify-center text-slate-400">{getIcon(parent.menu_det_icono)}</div></td>
                        <td className="px-8 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <Button onClick={() => handleOpenCreate(parent.menu_det_cod)} variant="outline" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-500/10 border-slate-800 bg-transparent" title="Agregar Subitem"><Plus className="h-4 w-4" /></Button>
                            <Button onClick={() => handleOpenEdit(parent)} variant="outline" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-800 bg-transparent"><Edit3 className="h-3.5 w-3.5" /></Button>
                            <Button onClick={() => { setItemToDelete(parent.menu_det_cod); setIsConfirmOpen(true); }} variant="outline" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-500 hover:bg-red-500/10 border-slate-800 bg-transparent"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                      {!isCollapsed && children.map((child: any) => (
                        <tr key={child.menu_det_cod} className="bg-white/[0.01] hover:bg-white/[0.03] transition-colors group">
                          <td className="px-8 py-4 font-mono text-[10px] text-slate-600 text-center italic">{child.menu_det_det_orden}</td>
                          <td className="px-8 py-4 pl-20 relative">
                             <div className="absolute left-12 top-1/2 -translate-y-1/2 w-6 h-px bg-slate-800"></div>
                             <span className="font-bold text-slate-400 text-sm">{child.menu_det_nombre}</span>
                             {child.menu_cargar_inicio && (
                               <Badge className="ml-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-black uppercase tracking-tighter h-4">INICIO</Badge>
                             )}
                             <Badge variant="outline" className={`ml-1 text-[8px] h-3.5 font-black ${child.menu_det_estado === 'I' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                               {child.menu_det_estado === 'I' ? 'OFF' : 'ON'}
                             </Badge>
                          </td>
                          <td className="px-8 py-4 text-xs font-mono text-slate-600">{child.menu_det_url || "—"}</td>
                          <td className="px-8 py-4 text-center"><div className="flex justify-center text-slate-500 opacity-60 scale-90">{getIcon(child.menu_det_icono)}</div></td>
                          <td className="px-8 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button onClick={() => handleOpenEdit(child)} variant="outline" size="icon" className="h-7 w-7 border-slate-800 text-slate-500 hover:text-white hover:bg-slate-800 bg-transparent"><Edit3 className="h-3 w-3" /></Button>
                              <Button onClick={() => { setItemToDelete(child.menu_det_cod); setIsConfirmOpen(true); }} variant="outline" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-500 hover:bg-red-500/10 border-slate-800 bg-transparent"><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Configurar Opción" : "Nueva Opción"} variant="dark">
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Nombre de la Opción</Label>
            <Input className="bg-slate-950 border-slate-800 text-white h-12 rounded-xl" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-400 text-[10px] font-black uppercase tracking-widest">URL / Ruta</Label>
              <Input className="bg-slate-950 border-slate-800 text-white h-12 rounded-xl font-mono text-xs" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Icono (Lucide)</Label>
              <div className="flex gap-2">
                <Input className="bg-slate-950 border-slate-800 text-white h-12 rounded-xl font-mono text-xs" value={formData.icono} onChange={e => setFormData({...formData, icono: e.target.value})} placeholder="package" />
                <div className="h-12 w-12 flex items-center justify-center bg-slate-950 border border-slate-800 rounded-xl text-amber-500">{getIcon(formData.icono)}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Orden</Label>
              <Input className="bg-slate-950 border-slate-800 text-white h-12 rounded-xl" type="number" value={formData.orden} onChange={e => setFormData({...formData, orden: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Padre</Label>
              <select 
                className="flex h-12 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                value={formData.parent}
                onChange={e => setFormData({...formData, parent: e.target.value})}
                disabled={isParentFixed}
              >
                <option value="">Ninguno (Es Padre)</option>
                {parentItems.map(p => (
                  <option key={p.menu_det_cod} value={p.menu_det_cod}>
                    {p.menu_det_nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Estado del Ítem</Label>
            <select 
              className="flex h-12 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white appearance-none"
              value={formData.estado}
              onChange={e => setFormData({...formData, estado: e.target.value})}
            >
              <option value="A">Activo</option>
              <option value="I">Inactivo</option>
            </select>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 transition-all hover:bg-emerald-500/5 hover:border-emerald-500/20">
            <input 
              type="checkbox" 
              id="cargar_inicio"
              className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/20"
              checked={formData.cargar_inicio}
              onChange={e => setFormData({...formData, cargar_inicio: e.target.checked})}
            />
            <label htmlFor="cargar_inicio" className="text-xs font-bold text-slate-400 cursor-pointer select-none uppercase tracking-tighter">
              Marcar como Pantalla Inicial (Redirect después del Login)
            </label>
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-tighter h-12 rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-95">
              <Save className="h-4 w-4 mr-2" /> Guardar Cambios
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

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="¿Eliminar ítem?" description="Esta acción borrará el ítem y sus dependencias." variant="dark" />
    </div>
  );
}
