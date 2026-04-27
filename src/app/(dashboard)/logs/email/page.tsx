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
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Eye,
  Hash,
  MessageSquare
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logs/email");
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
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
    if (s === 'enviado' || s === 'success') {
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black text-[9px]">ENVIADO</Badge>;
    }
    if (s === 'error' || s === 'failed') {
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 font-black text-[9px]">FALLIDO</Badge>;
    }
    return <Badge variant="outline" className="text-[9px] font-black uppercase">{estado || 'PENDIENTE'}</Badge>;
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Auditoría de Email</h1>
          <p className="text-muted mt-1">Monitoreo de notificaciones y correos enviados por el sistema.</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="border-border shadow-sm">
          Actualizar Logs
        </Button>
      </div>

      <Card className="bg-card border-border shadow-xl overflow-hidden">
        <CardHeader className="border-b bg-background/50">
          <CardTitle className="text-lg">Registro de Comunicaciones</CardTitle>
          <CardDescription>Visualiza los últimos correos procesados por la plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-background/30 text-xs uppercase tracking-widest text-muted font-bold">
                  <th className="px-6 py-4 w-24">ID</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Destinatario</th>
                  <th className="px-6 py-4">Asunto</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-muted italic">Sincronizando logs de auditoría...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-muted italic">No se encontraron registros de correo.</td></tr>
                ) : logs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-background/40 transition-colors group">
                    <td className="px-6 py-4 font-mono text-[11px] text-muted">#{log.log_id}</td>
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
                      <div className="text-sm font-medium text-slate-500 truncate max-w-[200px]" title={log.log_asunto}>
                        {log.log_asunto}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(log.log_estado)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button onClick={() => openLog(log)} variant="outline" size="sm" className="h-8 gap-2 border-border hover:bg-background hover:text-accent font-bold text-xs uppercase tracking-tight">
                        <Eye className="h-3.5 w-3.5" /> Detalles
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Detalle del Correo">
        {selectedLog && (
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Transacción</p>
                <div className="flex items-center gap-2 font-mono text-sm font-bold text-accent">
                  <Hash className="h-3.5 w-3.5" /> {selectedLog.log_id}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                <div>{getStatusBadge(selectedLog.log_estado)}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2"><User className="h-3 w-3" /> Destinatario:</p>
                <p className="text-sm font-medium pl-5">{selectedLog.log_destinatario}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2"><Info className="h-3 w-3" /> Asunto:</p>
                <p className="text-sm font-medium pl-5">{selectedLog.log_asunto}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2"><MessageSquare className="h-3 w-3" /> Contenido del Mensaje:</p>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 max-h-[300px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                  {selectedLog.log_cuerpo || "No hay contenido registrado."}
                </div>
              </div>

              {selectedLog.log_error && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-red-500 flex items-center gap-2"><AlertCircle className="h-3 w-3" /> Log de Error:</p>
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-mono text-red-600 leading-relaxed">
                    {selectedLog.log_error}
                  </div>
                </div>
              )}
            </div>

            <div className="flex pt-4">
              <Button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-900 text-white font-bold uppercase tracking-widest">Cerrar Detalle</Button>
            </div>
          </div>
        )}
      </CustomModal>
    </div>
  );
}
