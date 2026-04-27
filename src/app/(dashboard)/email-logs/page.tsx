"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomModal } from "@/components/ui/dialog-custom";
import { 
  Mail, 
  Calendar, 
  User, 
  Info, 
  Eye, 
  Hash, 
  MessageSquare, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle
} from "lucide-react";

interface EmailLog {
  log_id: number;
  log_fecha: string | null;
  log_destinatario: string;
  log_asunto: string;
  log_cuerpo: string | null;
  log_estado: string | null;
  log_error: string | null;
}

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logs/email");
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
      setCurrentPage(1); // Volver a la 1 al actualizar
    } catch (e) {
      console.error("Error fetching logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openLog = (log: EmailLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (estado: string | null) => {
    const s = estado?.toLowerCase();
    if (s === 'enviado' || s === 'success' || s === 'a') {
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black text-[9px]">ENVIADO</Badge>;
    }
    if (s === 'error' || s === 'failed' || s === 'e') {
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 font-black text-[9px]">FALLIDO</Badge>;
    }
    return <Badge variant="outline" className="text-[9px] font-black uppercase text-slate-400">{estado || 'PENDIENTE'}</Badge>;
  };

  // Lógica de Paginación
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLogs = logs.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Logs de Email</h1>
          <p className="text-muted mt-1">Directorio histórico de comunicaciones y estados de entrega.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchData} variant="outline" className="border-border shadow-sm font-bold text-xs uppercase tracking-tight gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border shadow-xl overflow-hidden">
        <CardHeader className="border-b bg-background/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/5 text-accent border border-accent/10">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Registro de Auditoría</CardTitle>
              <CardDescription>Visualización de los últimos envíos del sistema.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-background/30 text-xs uppercase tracking-widest text-muted font-bold">
                  <th className="px-6 py-4 w-24 text-center">ID</th>
                  <th className="px-6 py-4">Fecha de Envío</th>
                  <th className="px-6 py-4">Destinatario</th>
                  <th className="px-6 py-4">Asunto del Mensaje</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-muted italic">Cargando registros históricos...</td></tr>
                ) : currentLogs.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-muted italic">No se encontraron registros de comunicaciones.</td></tr>
                ) : currentLogs.map((log) => (
                  <tr key={log.log_id} onClick={() => openLog(log)} className="hover:bg-background/40 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 font-mono text-[11px] text-muted text-center italic">#{log.log_id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                        <Calendar className="h-4 w-4 opacity-40" />
                        {formatDate(log.log_fecha)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold text-slate-700">
                        <User className="h-4 w-4 text-slate-400" />
                        {log.log_destinatario}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-500 truncate max-w-[250px]" title={log.log_asunto}>
                        {log.log_asunto}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(log.log_estado)}
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
                Mostrando <span className="text-foreground font-bold">{logs.length > 0 ? startIndex + 1 : 0}</span> a <span className="text-foreground font-bold">{Math.min(startIndex + itemsPerPage, logs.length)}</span> de <span className="text-foreground font-bold">{logs.length}</span> registros
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

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Audit Log: Detalle de Comunicación">
        {selectedLog && (
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Identificador Único</p>
                <div className="flex items-center gap-2 font-mono text-sm font-bold text-accent">
                  <Hash className="h-3.5 w-3.5" /> LOG-{selectedLog.log_id}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resultado del Envío</p>
                <div>{getStatusBadge(selectedLog.log_estado)}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2 uppercase tracking-tighter"><User className="h-3 w-3 text-accent" /> Destinatario:</p>
                  <p className="text-sm font-bold pl-5 text-slate-700">{selectedLog.log_destinatario}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2 uppercase tracking-tighter"><Calendar className="h-3 w-3 text-accent" /> Fecha:</p>
                  <p className="text-sm font-bold pl-5 text-slate-700">{formatDate(selectedLog.log_fecha)}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2 uppercase tracking-tighter"><Info className="h-3 w-3 text-accent" /> Asunto:</p>
                <p className="text-sm font-bold pl-5 text-slate-700">{selectedLog.log_asunto}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2 uppercase tracking-tighter"><MessageSquare className="h-4 w-4 text-accent" /> Contenido del Email:</p>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-[13px] font-sans text-slate-600 max-h-[250px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner scrollbar-thin">
                  {selectedLog.log_cuerpo || <span className="italic text-slate-400">Sin contenido registrado.</span>}
                </div>
              </div>

              {selectedLog.log_error && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-red-500 flex items-center gap-2 uppercase tracking-tighter"><AlertCircle className="h-3.5 w-3.5" /> Error Técnico:</p>
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-[11px] font-mono text-red-600 leading-relaxed break-words">
                    {selectedLog.log_error}
                  </div>
                </div>
              )}
            </div>

            <div className="flex pt-4">
              <Button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-[0.2em] h-12 rounded-xl transition-all active:scale-95 shadow-lg">Cerrar Visor de Logs</Button>
            </div>
          </div>
        )}
      </CustomModal>
    </div>
  );
}
