"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomModal } from "@/components/ui/dialog-custom";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { 
  Plus, Map, Globe, Landmark, Home, Edit3, Trash2, CheckCircle2, Save, Search, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MapPin, ChevronDown,
  Upload, Loader2, Settings2, Table, Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";

const PolygonMap = dynamic(() => import("@/components/maps/PolygonMap"), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 border border-dashed border-slate-300">Cargando Mapa Interactivo...</div>
});

type LocationType = "dep" | "dis" | "ciu" | "bar" | "zon";

export default function ConfigLocationsPage() {
  const [activeTab, setActiveTab] = useState<LocationType>("dep");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const [deps, setDeps] = useState<any[]>([]);
  const [distritos, setDistritos] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para Importación Masiva Inteligente
  const [isBulkPreviewOpen, setIsBulkPreviewOpen] = useState(false);
  const [bulkFeatures, setBulkFeatures] = useState<any[]>([]);
  const [availableProps, setAvailableProps] = useState<string[]>([]);
  const [mapping, setMapping] = useState({ nameKey: "", cityKey: "", stateKey: "" });
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const [formData, setFormData] = useState({
    dsc: "",
    depCod: "",
    disCod: "",
    ciuCod: "",
    color: "#3498db",
    poligono: null as any
  });

  const [gridFilters, setGridFilters] = useState({
    dep: "",
    dis: "",
    ciu: ""
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/config-locations?type=${activeTab}`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
      setCurrentPage(1);

      const rDep = await fetch("/api/admin/config-locations?type=dep");
      setDeps(await rDep.json());
      const rDis = await fetch("/api/admin/config-locations?type=dis");
      setDistritos(await rDis.json());
      const rCiu = await fetch("/api/admin/config-locations?type=ciu");
      setCiudades(await rCiu.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setGridFilters({ dep: "", dis: "", ciu: "" });
  }, [activeTab]);

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ dsc: "", depCod: "", disCod: "", ciuCod: "", color: "#3498db", poligono: null });
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    const id = item.dep_cod || item.dis_cod || item.ciu_cod || item.bar_cod || item.zon_id;
    const dsc = item.dep_dsc || item.dis_dsc || item.ciu_dsc || item.bar_dsc || item.zon_nombre;
    
    setFormData({
      dsc: dsc,
      depCod: (item.dis_dep_cod || item.ciu_dep_cod || item.bar_dep_cod || "").toString(),
      disCod: (item.ciu_dis_cod || item.bar_dis_cod || "").toString(),
      ciuCod: (item.bar_ciu_cod || "").toString(),
      color: item.zon_color || "#3498db",
      poligono: item.zon_poligono || null
    });
    setIsModalOpen(true);
  };

  const openDelete = (item: any) => {
    setItemToDelete(item);
    setIsConfirmOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingItem ? (editingItem.dep_cod || editingItem.dis_cod || editingItem.ciu_cod || editingItem.bar_cod || editingItem.zon_id) : null;
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/admin/config-locations/${id}` : "/api/admin/config-locations";

    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const usuarioPk = user?.id?.toString() || "SISTEMA";

    const res = await fetch(url, {
      method,
      body: JSON.stringify({ 
        type: activeTab, 
        data: { ...formData, usuario: usuarioPk } 
      }),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      setIsModalOpen(false);
      showToast(editingItem ? "Registro actualizado" : "Registro guardado");
      fetchData();
    } else {
       const err = await res.json();
       showToast(err.error || "Error al procesar");
    }
  };

  // LÓGICA DE IMPORTACIÓN MASIVA INTELIGENTE
  const handleBulkFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = (e.target?.result as string).trim();
        const json = JSON.parse(content);
        
        if (json.type !== "FeatureCollection" || !json.features) {
          showToast("Formato GeoJSON no válido (se requiere FeatureCollection).");
          return;
        }

        const validFeatures = json.features.filter((f: any) => 
          f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")
        );

        if (validFeatures.length === 0) {
          showToast("No se encontraron polígonos en el archivo.");
          return;
        }

        const props = Object.keys(validFeatures[0].properties || {});
        setAvailableProps(props);
        setBulkFeatures(validFeatures);
        
        // Guess keys (including Peru INEI headers)
        const nameGuess = props.find(p => ["NOMBDIST", "NOM_CAP", "BARLO_DESC", "NOM", "NAME", "NOMBRE", "BARRIO"].includes(p.toUpperCase())) || props[0];
        const cityGuess = props.find(p => ["NOMBPROV", "DIST_DESC", "DISTRITO", "CIUDAD", "CITY"].includes(p.toUpperCase())) || "";
        const stateGuess = props.find(p => ["NOMBDEP", "DPTO_DESC", "DEPARTAMENTO", "STATE"].includes(p.toUpperCase())) || "";
        
        setMapping({ nameKey: nameGuess, cityKey: cityGuess, stateKey: stateGuess });
        setIsBulkPreviewOpen(true);
      } catch (err: any) {
        console.error("Bulk Import Error:", err);
        showToast(`Error al leer el archivo: ${err.message}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processBulkImport = async () => {
    setIsBulkLoading(true);
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const usuarioPk = user?.id?.toString() || "SISTEMA";

    let successCount = 0;
    const colors = ["#3498db", "#e74c3c", "#2ecc71", "#f1c40f", "#9b59b6", "#1abc9c", "#e67e22", "#34495e", "#ff4757", "#2f3542"];

    for (const feature of bulkFeatures) {
      const barrio = feature.properties?.[mapping.nameKey] || "Zona";
      const ciudad = mapping.cityKey ? feature.properties?.[mapping.cityKey] : "";
      const depto = mapping.stateKey ? feature.properties?.[mapping.stateKey] : "";
      
      let fullName = barrio;
      if (ciudad && depto) fullName = `${barrio} (${ciudad}, ${depto})`;
      else if (ciudad) fullName = `${barrio} (${ciudad})`;
      else if (depto) fullName = `${barrio} (${depto})`;

      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      try {
        await fetch("/api/admin/config-locations", {
          method: "POST",
          body: JSON.stringify({ 
            type: "zon", 
            data: { dsc: fullName, color: randomColor, poligono: feature.geometry, usuario: usuarioPk } 
          }),
          headers: { "Content-Type": "application/json" }
        });
        successCount++;
      } catch (err) {}
    }

    setIsBulkLoading(false);
    setIsBulkPreviewOpen(false);
    showToast(`Se crearon ${successCount} zonas correctamente.`);
    fetchData();
  };

  const onConfirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete.dep_cod || itemToDelete.dis_cod || itemToDelete.ciu_cod || itemToDelete.bar_cod || itemToDelete.zon_id;
    const res = await fetch(`/api/admin/config-locations/${id}?type=${activeTab}`, { method: "DELETE" });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Registro eliminado");
      fetchData();
    } else {
       const err = await res.json();
       showToast(err.error || "Error al eliminar");
    }
  };

  const filteredData = data.filter(item => {
    const dscRaw = (item.dep_dsc || item.dis_dsc || item.ciu_dsc || item.bar_dsc || item.zon_nombre || "");
    const matchesSearch = dscRaw.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === "dis") {
      if (gridFilters.dep && item.dis_dep_cod !== parseInt(gridFilters.dep)) return false;
    }
    if (activeTab === "ciu") {
      if (gridFilters.dep && item.ciu_dep_cod !== parseInt(gridFilters.dep)) return false;
      if (gridFilters.dis && item.ciu_dis_cod !== parseInt(gridFilters.dis)) return false;
    }
    if (activeTab === "bar") {
      if (gridFilters.dep && item.bar_dep_cod !== parseInt(gridFilters.dep)) return false;
      if (gridFilters.dis && item.bar_dis_cod !== parseInt(gridFilters.dis)) return false;
      if (gridFilters.ciu && item.bar_ciu_cod !== parseInt(gridFilters.ciu)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const tabs = [
    { id: "dep", label: "Departamentos", icon: Globe },
    { id: "dis", label: "Distritos", icon: Map },
    { id: "ciu", label: "Ciudades", icon: Landmark },
    { id: "bar", label: "Barrios", icon: Home },
    { id: "zon", label: "Zonas", icon: MapPin }
  ] as const;

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
          <h1 className="text-3xl font-bold tracking-tight text-accent">Configuración Geográfica</h1>
          <p className="text-muted mt-1 font-medium italic">Gestión jerárquica de ubicaciones para el sistema.</p>
        </div>
        <div className="flex gap-3">
          {activeTab === "zon" && (
            <>
              <input type="file" ref={fileInputRef} onChange={handleBulkFileChange} className="hidden" accept=".json,.geojson" />
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="outline" 
                className="border-slate-200 text-slate-600 font-bold hover:bg-slate-50 h-11 px-6 rounded-xl shadow-sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importación Masiva
              </Button>
            </>
          )}
          <Button onClick={openCreate} className="bg-accent text-white font-bold hover:brightness-105 h-11 px-6 rounded-xl shadow-lg shadow-accent/20 transition-all">
            <Plus className="h-4 w-4 mr-2 stroke-[3]" /> Agregar {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100/50 rounded-xl w-fit border border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-[13px] transition-all ${
              activeTab === tab.id ? "bg-white text-accent shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="bg-card border-none shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 space-y-4">
           <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-slate-700">Registros del Catálogo</CardTitle>
                <CardDescription className="text-xs">Visualiza y administra las ubicaciones configuradas.</CardDescription>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                  <Input placeholder="Buscar..." className="h-9 border-slate-200 bg-white w-48 pl-9 text-sm" value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
                </div>

                {activeTab !== "dep" && activeTab !== "zon" && (
                  <div className="flex gap-2">
                    <select className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-500 outline-none" value={gridFilters.dep} onChange={e => {setGridFilters({...gridFilters, dep: e.target.value, dis:"", ciu:""}); setCurrentPage(1);}}>
                        <option value="">DPTO</option>
                        {deps.map(d => <option key={d.dep_cod} value={d.dep_cod}>{d.dep_dsc}</option>)}
                    </select>
                    {(activeTab === "ciu" || activeTab === "bar") && (
                      <select className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-500 outline-none" value={gridFilters.dis} onChange={e => {setGridFilters({...gridFilters, dis: e.target.value, ciu:""}); setCurrentPage(1);}} disabled={!gridFilters.dep}>
                          <option value="">DIST</option>
                          {distritos.filter(d => !gridFilters.dep || d.dis_dep_cod === parseInt(gridFilters.dep)).map(d => <option key={d.dis_cod} value={d.dis_cod}>{d.dis_dsc}</option>)}
                      </select>
                    )}
                  </div>
                )}
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] tracking-tight text-slate-400 font-bold uppercase">
                  <th className="px-8 py-4 w-24 text-center">ID</th>
                  <th className="px-8 py-4">Descripción / Nombre</th>
                  {activeTab !== "dep" && activeTab !== "zon" && <th className="px-8 py-4">Jerarquía</th>}
                  {activeTab === "zon" && <th className="px-8 py-4 text-center">Color</th>}
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={10} className="px-8 py-10 text-center text-slate-400 italic">Cargando...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={10} className="px-8 py-10 text-center text-slate-400 italic">No hay resultados.</td></tr>
                ) : currentItems.map((item, idx) => {
                  const id = item.dep_cod || item.dis_cod || item.ciu_cod || item.bar_cod || item.zon_id;
                  const dsc = item.dep_dsc || item.dis_dsc || item.ciu_dsc || item.bar_dsc || item.zon_nombre;
                  return (
                    <tr key={`${activeTab}-${idx}`} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-4 font-mono text-[11px] text-accent font-bold text-center">#{id}</td>
                      <td className="px-8 py-4 font-bold text-slate-700 text-[14px]">{dsc}</td>
                      {activeTab !== "dep" && activeTab !== "zon" && (
                        <td className="px-8 py-4">
                          <span className="text-[11px] font-bold text-slate-400">
                            {activeTab === "dis" && item.departamento?.dep_dsc}
                            {activeTab === "ciu" && `${item.distrito?.departamento?.dep_dsc} > ${item.distrito?.dis_dsc}`}
                            {activeTab === "bar" && `${item.ciudad?.distrito?.dis_dsc} > ${item.ciudad?.ciu_dsc}`}
                          </span>
                        </td>
                      )}
                      {activeTab === "zon" && (
                        <td className="px-8 py-4 text-center">
                           <div className="flex items-center justify-center gap-2">
                             <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: item.zon_color }}></div>
                             <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{item.zon_color}</span>
                           </div>
                        </td>
                      )}
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 gap-2 border-slate-200 hover:bg-slate-50 transition-all px-3 font-bold text-xs shadow-sm text-slate-600">
                             <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" /> Editar
                           </Button>
                           <Button onClick={() => openDelete(item)} variant="outline" size="icon" className="h-8 w-8 text-red-500 border-transparent hover:bg-red-50 transition-all">
                             <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                           </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
             <span className="text-[11px] font-bold text-slate-400 uppercase">Total: {filteredData.length}</span>
             <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setCurrentPage(Math.max(1, currentPage-1))} disabled={currentPage===1}>Anterior</Button>
                <div className="flex items-center px-4 bg-white border border-slate-200 rounded-lg text-xs font-bold text-accent">{currentPage} / {totalPages || 1}</div>
                <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setCurrentPage(Math.min(totalPages, currentPage+1))} disabled={currentPage===totalPages || totalPages === 0}>Siguiente</Button>
             </div>
          </div>
        </CardContent>
      </Card>

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${editingItem ? 'Editar' : 'Nuevo/a'} ${tabs.find(t=>t.id===activeTab)?.label.slice(0,-1)}`}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {activeTab !== "dep" && activeTab !== "zon" && (
            <div className="space-y-2"><Label>Departamento Padre</Label><select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={formData.depCod} onChange={e => setFormData({...formData, depCod: e.target.value})} required><option value="">Seleccione...</option>{deps.map(d => <option key={d.dep_cod} value={d.dep_cod}>{d.dep_dsc}</option>)}</select></div>
          )}
          {(activeTab === "ciu" || activeTab === "bar") && (
            <div className="space-y-2"><Label>Distrito Padre</Label><select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={formData.disCod} onChange={e => setFormData({...formData, disCod: e.target.value})} required disabled={!formData.depCod}><option value="">Seleccione...</option>{distritos.filter(d => d.dis_dep_cod === parseInt(formData.depCod)).map(d => <option key={d.dis_cod} value={d.dis_cod}>{d.dis_dsc}</option>)}</select></div>
          )}
          {activeTab === "bar" && (
            <div className="space-y-2"><Label>Ciudad Padre</Label><select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={formData.ciuCod} onChange={e => setFormData({...formData, ciuCod: e.target.value})} required disabled={!formData.disCod}><option value="">Seleccione...</option>{ciudades.filter(c => c.ciu_dep_cod === parseInt(formData.depCod) && c.ciu_dis_cod === parseInt(formData.disCod)).map(c => <option key={c.ciu_cod} value={c.ciu_cod}>{c.ciu_dsc}</option>)}</select></div>
          )}
          {activeTab === "zon" && (
             <div className="space-y-2">
                <Label>Color de la Zona</Label>
                <div className="flex gap-2">
                  <Input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-12 h-10 p-1" />
                  <Input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="font-mono uppercase" />
                </div>
             </div>
          )}
          <div className="space-y-2"><Label>Nombre / Descripción</Label><Input value={formData.dsc} onChange={e => setFormData({...formData, dsc: e.target.value})} placeholder="Ingrese nombre..." required autoFocus /></div>
          
          {activeTab === "zon" && (
            <div className="space-y-2">
              <Label className="flex justify-between items-center">
                <span>Perímetro de la Zona (Polígono)</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest bg-slate-100 px-2 py-0.5 rounded">PostGIS WGS84</span>
              </Label>
              <PolygonMap 
                key={editingItem ? `map-${editingItem.dep_cod || editingItem.dis_cod || editingItem.ciu_cod || editingItem.bar_cod || editingItem.zon_id}` : 'map-new'}
                initialGeoJSON={formData.poligono}
                color={formData.color}
                onPolygonChange={(geojson) => setFormData({ ...formData, poligono: geojson })}
                onMetadataChange={(name, color) => setFormData({ ...formData, dsc: name, color: color })}
              />
              <p className="text-[10px] text-slate-400 italic">Usa las herramientas de la derecha para dibujar un polígono en el mapa.</p>
            </div>
          )}
          <div className="flex gap-3 pt-6">
            <Button type="submit" className="flex-1 bg-accent text-white font-bold h-12 rounded-2xl shadow-lg shadow-accent/20 flex gap-2 uppercase tracking-tighter transition-all hover:scale-[1.02] active:scale-95"><Save className="h-4 w-4" /> Guardar Registro</Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-tighter text-slate-500">Cancelar</Button>
          </div>
        </form>
      </CustomModal>

      {/* MODAL DE IMPORTACIÓN MASIVA INTELIGENTE */}
      <CustomModal isOpen={isBulkPreviewOpen} onClose={() => setIsBulkPreviewOpen(false)} title="Configurar Importación Masiva">
        <div className="space-y-6 pt-2">
          <div className="bg-accent/5 p-4 rounded-2xl border border-accent/10 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-white">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-800 leading-tight">Mapeo de Columnas</p>
              <p className="text-xs text-slate-500 mt-0.5">Detectamos {bulkFeatures.length} zonas. Selecciona la jerarquía del nombre.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Columna del Nombre (Ej: Barrio)</Label>
              <select className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition-all" value={mapping.nameKey} onChange={e => setMapping({...mapping, nameKey: e.target.value})}>
                {availableProps.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Ciudad / Distrito</Label>
                <select className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition-all" value={mapping.cityKey} onChange={e => setMapping({...mapping, cityKey: e.target.value})}>
                  <option value="">(Ninguna)</option>
                  {availableProps.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Depto / Estado</Label>
                <select className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition-all" value={mapping.stateKey} onChange={e => setMapping({...mapping, stateKey: e.target.value})}>
                  <option value="">(Ninguna)</option>
                  {availableProps.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Eye className="h-3 w-3" /> Vista Previa de Nombres
            </Label>
            <div className="border rounded-xl overflow-hidden bg-slate-50/50 p-2 max-h-40 overflow-y-auto">
               <div className="space-y-1">
                  {bulkFeatures.slice(0, 5).map((f, i) => {
                     const b = f.properties?.[mapping.nameKey] || "N/A";
                     const c = mapping.cityKey ? f.properties?.[mapping.cityKey] : "";
                     const s = mapping.stateKey ? f.properties?.[mapping.stateKey] : "";
                     let full = b;
                     if (c && s) full = `${b} (${c}, ${s})`;
                     else if (c) full = `${b} (${c})`;
                     else if (s) full = `${b} (${s})`;
                     return (
                       <div key={i} className="bg-white border rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-700 flex justify-between items-center">
                         <span>{full}</span>
                         <Badge variant="outline" className="text-[9px] uppercase">{f.geometry.type}</Badge>
                       </div>
                     );
                  })}
               </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={processBulkImport} disabled={isBulkLoading} className="flex-1 bg-accent text-white font-bold h-12 rounded-2xl shadow-lg flex gap-2 uppercase tracking-tighter transition-all hover:scale-[1.02]">
              {isBulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Iniciar Importación ({bulkFeatures.length})
            </Button>
            <Button variant="outline" onClick={() => setIsBulkPreviewOpen(false)} className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-tighter text-slate-500">Cancelar</Button>
          </div>
        </div>
      </CustomModal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={onConfirmDelete} title={`¿Eliminar ${tabs.find(t=>t.id===activeTab)?.label.slice(0,-1)}?`} description="Esta acción es permanente. Verifique que no haya registros vinculados antes de confirmar." />
    </div>
  );
}
