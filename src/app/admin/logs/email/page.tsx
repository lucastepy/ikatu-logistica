"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomModal } from "@/components/ui/dialog-custom";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Search, 
  Eye, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  RefreshCcw,
  Loader2,
  Calendar,
  AtSign
} from "lucide-react";

interface EmailLog {
  log_id: number;
  log_fecha: string;
  log_destinatario: string;
  log_asunto: string;
  log_cuerpo: string;
  log_estado: string;
  log_error: string | null;
}

export default function EmailLogPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [viewModal, setViewModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const [resendModal, setResendModal] = useState(false);
  const [resendData, setResendData] = useState({ logId: 0, nuevoDestinatario: "" });

  const fetchLogs = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/logs/email?page=${page}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage]);

  const handleResend = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/logs/email", {
        method: "POST",
        body: JSON.stringify(resendData),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setResendModal(false);
        fetchLogs(1); // Refresh to top
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openView = (log: EmailLog) => {
    setSelectedLog(log);
    setViewModal(true);
  };

  const openResend = (log: EmailLog) => {
    setResendData({ logId: log.log_id, nuevoDestinatario: log.log_destinatario });
    setResendModal(true);
  };

  const filteredLogs = logs.filter(l => 
    l.log_destinatario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.log_asunto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-white">Auditoría de <span className="text-red-500">Correos</span></h1>
          <p className="text-slate-400 mt-1 font-medium">Trazabilidad y gestión de comunicaciones transaccionales.</p>
        </div>
        <Button onClick={() => fetchLogs(1)} variant="outline" className="border-slate-800 bg-slate-900/50 text-slate-400 gap-2 rounded-xl">
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
        </Button>
      </div>

      <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-800 bg-slate-950/20 space-y-4 p-6">
           <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-white">Historial de Envíos</CardTitle>
                <CardDescription className="text-slate-500">Registros ordenados por fecha descendente.</CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 opacity-50" />
                <Input 
                  placeholder="Buscar por correo o asunto..." 
                  className="pl-10 h-10 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-400 rounded-xl"
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
                  <th className="px-6 py-4">Fecha / Hora</th>
                  <th className="px-6 py-4">Destinatario</th>
                  <th className="px-6 py-4">Asunto</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">Cargando registros de auditoría...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">No se encontraron logs de correo.</td></tr>
                ) : filteredLogs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-slate-800/40 transition-colors group text-sm">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        {new Date(log.log_fecha).toLocaleString('es-PY')}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-200">
                       <div className="flex items-center gap-2">
                         <AtSign className="h-3.5 w-3.5 text-[#00aeef]/50" />
                         {log.log_destinatario}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate">{log.log_asunto}</td>
                    <td className="px-6 py-4 text-center">
                       <Badge variant="outline" className={`font-black uppercase text-[9px] tracking-widest px-2 py-0.5 border-2 ${
                         log.log_estado === 'ENVIADO' 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                       }`}>
                         {log.log_estado === 'ENVIADO' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                         {log.log_estado}
                       </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                          <Button onClick={() => openView(log)} variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-800 bg-slate-900/50 hover:text-[#00aeef] transition-colors" title="Ver Mensaje">
                            <Eye className="h-3.5 w-3.5 text-slate-400" />
                          </Button>
                          {log.log_estado !== 'ENVIADO' && (
                            <Button onClick={() => openResend(log)} variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-800 bg-slate-900/50 hover:text-amber-500 transition-colors" title="Reenviar / Corregir">
                              <Send className="h-3.5 w-3.5 text-slate-400" />
                            </Button>
                          )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {!loading && total > 0 && (
            <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/20">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Mostrando <span className="text-white">{(currentPage - 1) * 10 + 1}</span> a <span className="text-white">{Math.min(currentPage * 10, total)}</span> de <span className="text-white">{total}</span> registros
               </p>
               <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4 text-slate-400" /></Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50" onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4 text-slate-400" /></Button>
                  
                  <div className="flex items-center gap-2 px-3">
                    <span className="text-red-500 font-black text-xs">{currentPage}</span>
                    <span className="text-slate-500 font-black text-[10px] uppercase tracking-widest">de</span>
                    <span className="text-slate-400 font-black text-xs">{totalPages}</span>
                  </div>

                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50" onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4 text-slate-400" /></Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800 bg-slate-950/50" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight className="h-4 w-4 text-slate-400" /></Button>
               </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Visualizar Mensaje */}
      <CustomModal
        isOpen={viewModal}
        onClose={() => setViewModal(false)}
        title="Vista Previa de Correo"
        description={`Enviado a: ${selectedLog?.log_destinatario}`}
        icon={Mail}
        className="max-w-3xl"
        variant="dark"
      >
        <div className="mt-4 p-6 bg-white rounded-2xl overflow-auto max-h-[60vh]">
           {selectedLog ? (
             <div dangerouslySetInnerHTML={{ __html: selectedLog.log_cuerpo }} />
           ) : null}
        </div>
        {selectedLog?.log_error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
             <p className="text-red-500 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
               <AlertCircle className="h-4 w-4" /> Detalle del Error
             </p>
             <code className="text-[10px] text-red-400 block break-all font-mono">
               {selectedLog.log_error}
             </code>
          </div>
        )}
      </CustomModal>

      {/* Modal Reenviar / Editar Correo */}
      <CustomModal
        isOpen={resendModal}
        onClose={() => setResendModal(false)}
        title="Gestionar Reenvío"
        description="Puedes corregir el destinatario si el envío original falló."
        icon={Send}
        variant="dark"
      >
        <div className="space-y-4 pt-4">
           <div className="space-y-2">
              <Label className="text-white font-bold text-xs tracking-widest">Correo Destinatario</Label>
              <Input 
                value={resendData.nuevoDestinatario}
                onChange={(e) => setResendData({...resendData, nuevoDestinatario: e.target.value})}
                className="bg-slate-950 border-slate-800 text-white rounded-xl"
              />
           </div>
           <div className="flex gap-3 pt-4">
              <Button onClick={handleResend} disabled={isSubmitting} className="flex-1 bg-[#00aeef] hover:bg-[#0092c8] text-white font-bold gap-2 rounded-xl">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar Ahora
              </Button>
              <Button variant="outline" onClick={() => setResendModal(false)} className="flex-1 border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-800 rounded-xl">
                Cancelar
              </Button>
           </div>
        </div>
      </CustomModal>
    </div>
  );
}
