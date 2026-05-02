"use client";

import { useFieldSecurity } from "@/hooks/useFieldSecurity";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomModal } from "@/components/ui/dialog-custom";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { Badge } from "@/components/ui/badge";

// Importación limpia de iconos
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Save, 
  Package,
  Hash,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Barcode,
  DollarSign,
  Scale,
  ShieldCheck,
  LayoutGrid,
  AlertTriangle
} from "lucide-react";

export default function ProductosPage() {
  const { isHidden, isReadOnly, loadingRestrictions } = useFieldSecurity("Producto");
  const [data, setData] = useState<any[]>([]);
  const [selectors, setSelectors] = useState<{marcas: any[], categorias: any[], unidades: any[]}>({
    marcas: [], categorias: [], unidades: []
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    marcaId: "",
    categoriaId: "",
    precioCosto: "0",
    precioContado: "0",
    garantia: "0",
    stock: "0",
    unidadMedidaId: "",
    peso: "0"
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const tenantId = user?.tenantId || "public";
      const headers = {
        "x-tenant-id": tenantId,
        "x-user-email": user?.email || "",
        "x-user-profile": user?.perfil_cod?.toString() || ""
      };

      const [resData, resSelectors] = await Promise.all([
        fetch("/api/productos", { headers }),
        fetch("/api/productos/selectors", { headers })
      ]);
      const jsonData = await resData.json();
      const jsonSelectors = await resSelectors.json();
      
      setData(Array.isArray(jsonData) ? jsonData : []);
      setSelectors(jsonSelectors);
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatNumberInput = (val: string) => {
    if (!val) return "";
    let clean = val.replace(/[^\d,]/g, "");
    const parts = clean.split(",");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    if (parts.length > 2) return parts[0] + "," + parts[1].slice(0, 2);
    return parts.join(",");
  };

  const parseToNumber = (val: string | number) => {
    if (typeof val === 'number') return val;
    const clean = val.toString().replace(/\./g, "").replace(",", ".");
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ 
      codigo: "SELECCIONE CATEGORÍA", nombre: "", marcaId: "", categoriaId: "", 
      precioCosto: "0", precioContado: "0", garantia: "0", 
      stock: "0", unidadMedidaId: "", peso: "0" 
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    const format = (v: any) => formatNumberInput((v || 0).toString().replace(".", ","));
    
    setFormData({ 
      codigo: item.prod_codigo, 
      nombre: item.prod_nombre, 
      marcaId: (item.prod_marca_id || "").toString(), 
      categoriaId: (item.prod_categoria_id || "").toString(), 
      precioCosto: format(item.prod_precio_costo), 
      precioContado: format(item.prod_precio_contado), 
      garantia: (item.prod_garantia_meses || 0).toString(), 
      stock: format(item.prod_stock_actual), 
      unidadMedidaId: (item.prod_uni_med || "").toString(), 
      peso: format(item.prod_peso_kg) 
    });
    setIsModalOpen(true);
  };

  const handleCategoryChange = (catId: string) => {
    if (editingItem) {
      setFormData({ ...formData, categoriaId: catId });
      return;
    }

    if (!catId) {
      setFormData({ ...formData, categoriaId: "", codigo: "SELECCIONE CATEGORÍA" });
      return;
    }

    const category = selectors.categorias.find(c => c.id.toString() === catId);
    if (category) {
      const prefijo = (category.prefijo || "").trim();
      const siguiente = (category.numerador || 0) + 1;
      
      if (!prefijo) {
        setFormData({ ...formData, categoriaId: catId, codigo: "CATEGORÍA SIN PREFIJO" });
      } else {
        const code = `PRD-${prefijo}-${siguiente.toString().padStart(3, '0')}`;
        setFormData({ ...formData, categoriaId: catId, codigo: code });
      }
    } else {
      setFormData({ ...formData, categoriaId: catId });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.codigo === "SELECCIONE CATEGORÍA" || formData.codigo === "CATEGORÍA SIN PREFIJO") {
      showToast(formData.codigo === "CATEGORÍA SIN PREFIJO" ? "La categoría seleccionada no tiene un prefijo definido" : "Debe seleccionar una categoría", 'error');
      return;
    }

    const costoNum = parseToNumber(formData.precioCosto);
    const ventaNum = parseToNumber(formData.precioContado);

    if (costoNum > ventaNum) {
      showToast(`El precio de costo no puede ser mayor al precio de venta.`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const method = editingItem ? "PUT" : "POST";
      const url = editingItem ? `/api/productos/${editingItem.prod_id}` : "/api/productos";

      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const tenantId = user?.tenantId || "public";
      const usuarioPk = user?.id?.toString() || "SISTEMA";

      const submissionData = {
        ...formData,
        precioCosto: costoNum,
        precioContado: ventaNum,
        stock: parseToNumber(formData.stock),
        peso: parseToNumber(formData.peso),
        usuario: usuarioPk
      };

      const res = await fetch(url, {
        method,
        body: JSON.stringify(submissionData),
        headers: { 
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-email": user?.email || "",
          "x-user-profile": user?.perfil_cod?.toString() || ""
        }
      });

      if (res.ok) {
        setIsModalOpen(false);
        showToast(editingItem ? "Producto actualizado" : "Producto creado", 'success');
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Error al procesar", 'error');
      }
    } catch (e) {
      console.error(e);
      showToast("Error de conexión", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (item: any) => {
    setItemToDelete(item);
    setIsConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!itemToDelete) return;
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const tenantId = user?.tenantId || "public";

    const res = await fetch(`/api/productos/${itemToDelete.prod_id}`, { 
      method: "DELETE",
      headers: {
        "x-tenant-id": tenantId,
        "x-user-email": user?.email || "",
        "x-user-profile": user?.perfil_cod?.toString() || ""
      }
    });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Producto eliminado", 'success');
      fetchData();
    } else {
       const err = await res.json();
       showToast(err.error || "No se pudo eliminar", 'error');
    }
  };

  const filteredData = data.filter(item => 
    item.prod_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.prod_codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.marca_nombre || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatDisplayCurrency = (val: number) => {
    return new Intl.NumberFormat('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);
  };

  if (loadingRestrictions && loading) {
    return <div className="h-screen flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Sincronizando Seguridad...</div>;
  }

  return (
    <div className="p-8 space-y-6 relative animate-in fade-in duration-500">
      
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100000] animate-in slide-in-from-top-20 duration-500">
          <div className={`${toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900'} text-white px-10 py-6 rounded-3xl shadow-[0_30px_90px_-10px_rgba(0,0,0,0.5)] flex items-center gap-5 border border-white/10 backdrop-blur-3xl`}>
            {toast.type === 'error' ? (
              <div className="p-2 bg-white/20 rounded-full">
                <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
              </div>
            ) : (
              <div className="p-2 bg-emerald-500/20 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight leading-tight">{toast.msg}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Catálogo de Productos</h1>
          <p className="text-muted mt-1 font-medium italic">Gestión integral de activos, precios y stocks.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold hover:brightness-105 h-11 px-6 rounded-xl shadow-lg shadow-accent/20 transition-all">
          <Plus className="h-4 w-4 mr-2 stroke-[3]" /> Nuevo Producto
        </Button>
      </div>

      <Card className="bg-card border-none shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
           <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-slate-700">Inventario Maestro</CardTitle>
                <CardDescription className="text-xs">Consulta y edición de parámetros de productos.</CardDescription>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                <Input 
                  placeholder="Buscar por código, nombre o marca..." 
                  className="h-9 border-slate-200 bg-white w-96 pl-9 text-sm rounded-xl focus:ring-accent text-slate-900 font-medium" 
                  value={searchTerm} 
                  onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} 
                />
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] tracking-tight text-slate-400 font-bold uppercase">
                  {!isHidden("prod_codigo") && <th className="px-8 py-4 w-48 text-center">Código</th>}
                  {!isHidden("prod_nombre") && <th className="px-8 py-4">Producto / Marca</th>}
                  {!isHidden("prod_categoria_id") && <th className="px-8 py-4 text-center">Categoría</th>}
                  {!isHidden("prod_precio_contado") && <th className="px-8 py-4 text-center">Precio Contado</th>}
                  {!isHidden("prod_stock_actual") && <th className="px-8 py-4 text-center">Stock</th>}
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-8 py-10 text-center text-slate-400 italic">Cargando catálogo...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={6} className="px-8 py-10 text-center text-slate-400 italic">No se encontraron productos disponibles.</td></tr>
                ) : currentItems.map((item) => (
                  <tr key={item.prod_id} className="hover:bg-slate-50/30 transition-colors group">
                    {!isHidden("prod_codigo") && (
                      <td className="px-8 py-4 text-center">
                         <span className="bg-accent/5 px-3 py-1.5 rounded-lg border border-accent/10 font-mono text-[11px] text-accent font-black whitespace-nowrap inline-block">
                          {item.prod_codigo}
                         </span>
                      </td>
                    )}
                    {!isHidden("prod_nombre") && (
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-100 text-slate-400 group-hover:text-accent transition-colors">
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-700 text-sm tracking-tight leading-tight">{item.prod_nombre}</p>
                            {!isHidden("prod_marca_id") && <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{item.marca_nombre || 'Sin Marca'}</p>}
                          </div>
                        </div>
                      </td>
                    )}
                    {!isHidden("prod_categoria_id") && (
                      <td className="px-8 py-4 text-center">
                        <Badge variant="secondary" className="font-bold text-[10px] bg-slate-100 text-slate-500 border-none">
                          {item.cat_prd_nombre || 'General'}
                        </Badge>
                      </td>
                    )}
                    {!isHidden("prod_precio_contado") && (
                      <td className="px-8 py-4 text-center font-bold text-slate-600 text-sm">
                        {formatDisplayCurrency(item.prod_precio_contado || 0)}
                      </td>
                    )}
                    {!isHidden("prod_stock_actual") && (
                      <td className="px-8 py-4 text-center">
                        <span className={`font-mono font-bold text-sm ${item.prod_stock_actual <= 5 ? 'text-red-500' : 'text-emerald-600'}`}>
                          {formatDisplayCurrency(item.prod_stock_actual || 0)}
                        </span>
                        {!isHidden("prod_uni_med") && <span className="text-[10px] text-slate-400 ml-1 font-bold">{item.uni_med_dsc || 'UN'}</span>}
                      </td>
                    )}
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
          
          {!loading && filteredData.length > 0 && (
            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/20">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                Mostrando <span className="text-slate-600 font-black">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="text-slate-600 font-black">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> de <span className="text-slate-600 font-black">{filteredData.length}</span> registros
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} title="Primero"><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} title="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
                
                <div className="flex items-center gap-1 mx-2">
                  <Badge variant="secondary" className="h-8 w-8 flex items-center justify-center p-0 rounded-lg bg-accent/10 text-accent font-bold border-accent/20">
                    {currentPage}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-black uppercase px-1">de</span>
                  <span className="text-[10px] text-slate-400 font-black uppercase px-1">{totalPages || 1}</span>
                </div>

                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} title="Siguiente"><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} title="Último"><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`${editingItem ? 'Editar' : 'Nuevo'} Producto`}
        className="max-w-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-white/50 backdrop-blur-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="grid grid-cols-3 gap-4 bg-accent/5 p-4 rounded-2xl border border-accent/10">
            {!isHidden("prod_categoria_id") && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-700 font-bold italic underline">1. Seleccione Categoría <LayoutGrid className="h-3 w-3 text-accent" /></Label>
                <select 
                  value={formData.categoriaId}
                  onChange={e => handleCategoryChange(e.target.value)}
                  className={`w-full h-11 rounded-xl border border-accent/20 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-accent/20 transition-all outline-none ${isReadOnly("prod_categoria_id") ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`}
                  required
                  disabled={isReadOnly("prod_categoria_id")}
                >
                  <option value="">Seleccione Categoría...</option>
                  {selectors.categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            )}
            {!isHidden("prod_marca_id") && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-700 font-bold">Marca <LayoutGrid className="h-3 w-3 text-accent" /></Label>
                <select 
                  value={formData.marcaId}
                  onChange={e => setFormData({...formData, marcaId: e.target.value})}
                  className={`w-full h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-accent/20 transition-all outline-none ${isReadOnly("prod_marca_id") ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`}
                  disabled={isReadOnly("prod_marca_id")}
                >
                  <option value="">Seleccione Marca...</option>
                  {selectors.marcas.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>
            )}
            {!isHidden("prod_uni_med") && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-700 font-bold">Unidad Medida <Scale className="h-3 w-3 text-accent" /></Label>
                <select 
                  value={formData.unidadMedidaId}
                  onChange={e => setFormData({...formData, unidadMedidaId: e.target.value})}
                  className={`w-full h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-accent/20 transition-all outline-none ${isReadOnly("prod_uni_med") ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`}
                  disabled={isReadOnly("prod_uni_med")}
                >
                  <option value="">Seleccione Unidad...</option>
                  {selectors.unidades.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {!isHidden("prod_codigo") && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-700 font-bold">Código Generado <Barcode className="h-3 w-3 text-accent" /></Label>
                <div className="relative">
                  <Input 
                    value={formData.codigo} 
                    readOnly
                    className={`h-11 font-mono uppercase bg-slate-100 border-slate-200 cursor-not-allowed shadow-inner ${formData.codigo === 'CATEGORÍA SIN PREFIJO' ? 'text-red-500 font-black whitespace-nowrap' : 'text-accent font-black whitespace-nowrap'}`}
                  />
                  {formData.codigo === 'CATEGORÍA SIN PREFIJO' && (
                    <AlertTriangle className="absolute right-3 top-3 h-4 w-4 text-red-500 animate-pulse" />
                  )}
                </div>
              </div>
            )}
            {!isHidden("prod_nombre") && (
              <div className={`space-y-2 ${isHidden("prod_codigo") ? "col-span-3" : "col-span-2"}`}>
                <Label className="flex items-center gap-2 text-slate-700 font-bold">Nombre del Producto <Package className="h-3 w-3 text-accent" /></Label>
                <Input 
                  value={formData.nombre} 
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                  placeholder="Ej: Smart TV 55' 4K Ultra HD" 
                  required 
                  className="h-11 bg-white border-slate-200 text-slate-900 font-medium shadow-sm placeholder:text-slate-300"
                  disabled={isReadOnly("prod_nombre")}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            {!isHidden("prod_precio_costo") && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase">Precio Costo <DollarSign className="h-3 w-3 text-accent" /></Label>
                <Input 
                  value={formData.precioCosto} 
                  onChange={e => setFormData({ ...formData, precioCosto: formatNumberInput(e.target.value) })} 
                  className="h-10 font-mono bg-white border-slate-200 text-slate-900"
                  placeholder="0,00"
                  disabled={isReadOnly("prod_precio_costo")}
                />
              </div>
            )}
            {!isHidden("prod_precio_contado") && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase text-accent">Precio Venta <DollarSign className="h-3 w-3" /></Label>
                <Input 
                  value={formData.precioContado} 
                  onChange={e => setFormData({ ...formData, precioContado: formatNumberInput(e.target.value) })} 
                  className="h-10 font-mono bg-white border-accent/20 focus:border-accent text-slate-900"
                  placeholder="0,00"
                  disabled={isReadOnly("prod_precio_contado")}
                />
              </div>
            )}
            {!isHidden("prod_stock_actual") && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase">Stock Inicial <Hash className="h-3 w-3 text-accent" /></Label>
                <Input 
                  value={formData.stock} 
                  onChange={e => setFormData({ ...formData, stock: formatNumberInput(e.target.value) })} 
                  className="h-10 font-mono bg-white border-slate-200 text-slate-900"
                  placeholder="0"
                  disabled={isReadOnly("prod_stock_actual")}
                />
              </div>
            )}
            {!isHidden("prod_garantia_meses") && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase">Garantía (Meses) <ShieldCheck className="h-3 w-3 text-accent" /></Label>
                <Input 
                  type="number"
                  value={formData.garantia} 
                  onChange={e => setFormData({ ...formData, garantia: e.target.value })} 
                  className="h-10 font-mono bg-white border-slate-200 text-slate-900"
                  placeholder="0"
                  disabled={isReadOnly("prod_garantia_meses")}
                />
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-accent text-white font-bold h-12 rounded-2xl shadow-lg shadow-accent/20 flex gap-2 uppercase tracking-tighter transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:scale-100">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? "Guardando..." : "Guardar Producto"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-tighter text-slate-500 border-slate-200 hover:bg-slate-50 transition-all">
              Cancelar
            </Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={onConfirmDelete} 
        title="¿Eliminar Producto?" 
        description="Esta acción eliminará el producto del catálogo maestro. Asegúrese de que no existan movimientos de stock vinculados." 
        variant="light"
      />
    </div>
  );
}
