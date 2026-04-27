"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomModal } from "@/components/ui/dialog-custom";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { 
  Plus, Users, Edit3, Trash2, CheckCircle2, Save, Search, 
  ChevronLeft, ChevronRight, UserPlus, Phone, Mail, FileText, ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ClientesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoDocs, setTipoDocs] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    razonSocial: "",
    tipDocId: "",
    nroDoc: "",
    esContribuyente: false,
    telefono: "",
    email: "",
    estado: "A"
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clientes");
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
      
      const resDocs = await fetch("/api/admin/config-locations?type=dep"); // Usando endpoint genérico si existe o uno específico
      // Nota: En un sistema real, tendríamos /api/admin/tipo-documentos
      // Por ahora, simularemos o usaremos el endpoint correcto si lo conocemos.
      // Basado en el schema, existe TipoDocumento.
      const rDocs = await fetch("/api/api-generica?tabla=tipo_documentos"); // Ajustar según disponibilidad
      const jDocs = await rDocs.json();
      setTipoDocs(jDocs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial de tipos de documentos (basado en el schema)
  const fetchTipoDocs = async () => {
    try {
      const res = await fetch("/api/api-generica?tabla=tipo_documentos"); 
      const json = await res.json();
      setTipoDocs(json);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
    fetchTipoDocs();
  }, []);

  const openCreate = () => {
    setEditingItem(null);
    setFormData({
      razonSocial: "",
      tipDocId: "",
      nroDoc: "",
      esContribuyente: false,
      telefono: "",
      email: "",
      estado: "A"
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      razonSocial: item.cli_razon_social,
      tipDocId: item.cli_tip_doc_id,
      nroDoc: item.cli_nro_doc,
      esContribuyente: item.cli_es_contribuyente || false,
      telefono: item.cli_telefono || "",
      email: item.cli_email || "",
      estado: item.cli_estado
    });
    setIsModalOpen(true);
  };

  const openDelete = (item: any) => {
    setItemToDelete(item);
    setIsConfirmOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/admin/clientes/${editingItem.cli_id}` : "/api/admin/clientes";

    const res = await fetch(url, {
      method,
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      setIsModalOpen(false);
      showToast(editingItem ? "Cliente actualizado" : "Cliente registrado");
      fetchData();
    } else {
       const err = await res.json();
       showToast(err.error || "Error al procesar");
    }
  };

  const onConfirmDelete = async () => {
    if (!itemToDelete) return;
    const res = await fetch(`/api/admin/clientes/${itemToDelete.cli_id}`, { method: "DELETE" });
    if (res.ok) {
      setIsConfirmOpen(false);
      showToast("Cliente desactivado");
      fetchData();
    } else {
       showToast("Error al eliminar");
    }
  };

  const filteredData = data.filter(item => 
    item.cli_razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.cli_nro_doc.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          <h1 className="text-3xl font-bold tracking-tight text-accent">Gestión de Clientes</h1>
          <p className="text-muted mt-1 font-medium italic">Administración de la cartera de clientes y contribuyentes.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-white font-bold hover:brightness-105 h-11 px-6 rounded-xl shadow-lg shadow-accent/20 transition-all">
          <UserPlus className="h-4 w-4 mr-2 stroke-[3]" /> Registrar Cliente
        </Button>
      </div>

      <Card className="bg-card border-none shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
           <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-slate-700">Cartera de Clientes</CardTitle>
                <CardDescription className="text-xs">Listado de clientes activos en el sistema.</CardDescription>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                <Input 
                  placeholder="Buscar por nombre o documento..." 
                  className="h-10 border-slate-200 bg-white w-80 pl-9 text-sm rounded-xl focus:ring-accent transition-all" 
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
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] tracking-tight text-slate-400 font-bold uppercase">
                  <th className="px-8 py-4">Razón Social</th>
                  <th className="px-8 py-4">Documento</th>
                  <th className="px-8 py-4">Contacto</th>
                  <th className="px-8 py-4 text-center">Tipo</th>
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-400 italic">Cargando clientes...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-400 italic">No se encontraron clientes.</td></tr>
                ) : currentItems.map((item) => (
                  <tr key={item.cli_id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-4">
                       <div className="flex flex-col">
                         <span className="font-bold text-slate-700 text-[14px]">{item.cli_razon_social}</span>
                         {item.cli_es_contribuyente && (
                           <span className="text-[10px] text-emerald-600 font-bold uppercase flex items-center gap-1">
                             <ShieldCheck className="h-3 w-3" /> Contribuyente
                           </span>
                         )}
                       </div>
                    </td>
                    <td className="px-8 py-4 font-mono text-[12px] text-slate-500">
                      <Badge variant="outline" className="bg-slate-100 border-none font-bold text-slate-600">
                        {item.cli_tip_doc_id}: {item.cli_nro_doc}
                      </Badge>
                    </td>
                    <td className="px-8 py-4">
                       <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2 text-slate-400 text-[12px]">
                           <Phone className="h-3 w-3" /> {item.cli_telefono || '---'}
                         </div>
                         <div className="flex items-center gap-2 text-slate-400 text-[12px]">
                           <Mail className="h-3 w-3" /> {item.cli_email || '---'}
                         </div>
                       </div>
                    </td>
                    <td className="px-8 py-4 text-center">
                       <Badge className={item.cli_estado === 'A' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}>
                         {item.cli_estado === 'A' ? "ACTIVO" : "INACTIVO"}
                       </Badge>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <Button onClick={() => openEdit(item)} variant="outline" size="sm" className="h-8 gap-2 border-slate-200 hover:bg-slate-50 px-3 font-bold text-xs text-slate-600">
                           <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" /> Editar
                         </Button>
                         <Button onClick={() => openDelete(item)} variant="outline" size="icon" className="h-8 w-8 text-red-500 border-transparent hover:bg-red-50">
                           <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                         </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
             <span className="text-[11px] font-bold text-slate-400 uppercase">Total: {filteredData.length} Clientes</span>
             <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setCurrentPage(Math.max(1, currentPage-1))} disabled={currentPage===1}>Anterior</Button>
                <div className="flex items-center px-4 bg-white border border-slate-200 rounded-lg text-xs font-bold text-accent">{currentPage} / {totalPages || 1}</div>
                <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setCurrentPage(Math.min(totalPages, currentPage+1))} disabled={currentPage===totalPages || totalPages === 0}>Siguiente</Button>
             </div>
          </div>
        </CardContent>
      </Card>

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${editingItem ? 'Editar' : 'Nuevo'} Cliente`}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo Documento</Label>
              <select 
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-accent" 
                value={formData.tipDocId} 
                onChange={e => setFormData({...formData, tipDocId: e.target.value})} 
                required
              >
                <option value="">Seleccione...</option>
                {tipoDocs.map(t => <option key={t.tip_doc_id} value={t.tip_doc_id}>{t.tip_doc_dsc}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Nro. Documento</Label>
              <Input 
                value={formData.nroDoc} 
                onChange={e => setFormData({...formData, nroDoc: e.target.value})} 
                placeholder="Ej: 1234567-8" 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Razón Social / Nombre Completo</Label>
            <Input 
              value={formData.razonSocial} 
              onChange={e => setFormData({...formData, razonSocial: e.target.value})} 
              placeholder="Ingrese el nombre del cliente..." 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono de Contacto</Label>
              <Input 
                value={formData.telefono} 
                onChange={e => setFormData({...formData, telefono: e.target.value})} 
                placeholder="Ej: +595 981 ..." 
              />
            </div>
            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <Input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                placeholder="ejemplo@mail.com" 
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <input 
              type="checkbox"
              id="esContribuyente" 
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent accent-accent cursor-pointer"
              checked={formData.esContribuyente} 
              onChange={(e) => setFormData({...formData, esContribuyente: e.target.checked})} 
            />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="esContribuyente" className="text-sm font-bold leading-none cursor-pointer text-slate-700">
                ¿Es Contribuyente?
              </label>
              <p className="text-xs text-slate-400 font-medium italic">Marque si el cliente emite facturas legales.</p>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="submit" className="flex-1 bg-accent text-white font-bold h-12 rounded-2xl shadow-lg shadow-accent/20 flex gap-2 uppercase tracking-tighter transition-all hover:scale-[1.02] active:scale-95">
              <Save className="h-4 w-4" /> {editingItem ? 'Actualizar' : 'Guardar'} Cliente
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-tighter text-slate-500 border-slate-200">
              Cancelar
            </Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={onConfirmDelete} 
        title="¿Desactivar Cliente?" 
        description="El cliente pasará a estado INACTIVO y no aparecerá en las operaciones principales, pero sus datos históricos se conservarán." 
      />
    </div>
  );
}
