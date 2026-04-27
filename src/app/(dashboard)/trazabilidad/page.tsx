'use client';

import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { History as HistoryIcon, Search, Filter, ArrowRight, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function TrazabilidadPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOrig, setFilterOrig] = useState("all");
  const [filterRef, setFilterRef] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = '/api/trazabilidad';
      const params = new URLSearchParams();
      if (filterOrig !== 'all') params.append('orig', filterOrig);
      if (filterRef) params.append('refId', filterRef);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url);
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterOrig, filterRef]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <HistoryIcon className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold tracking-tight">Trazabilidad de Flujos</h1>
        </div>
        <p className="text-muted-foreground">
          Auditoría completa de cambios de estado y movimientos en el sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" /> Origen del Flujo
          </label>
          <Select value={filterOrig} onValueChange={setFilterOrig}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar origen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Orígenes</SelectItem>
              <SelectItem value="VIAJE">Viajes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Search className="w-4 h-4" /> ID de Referencia
          </label>
          <Input 
            placeholder="Ej: 101" 
            value={filterRef}
            onChange={(e) => setFilterRef(e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <button 
            onClick={fetchLogs}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            Actualizar Listado
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead className="w-[120px]">Origen</TableHead>
              <TableHead className="w-[100px]">Ref. ID</TableHead>
              <TableHead>Movimiento de Estado</TableHead>
              <TableHead className="w-[150px]">Usuario</TableHead>
              <TableHead className="w-[180px]">Fecha / Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Cargando historial...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No se encontraron registros de trazabilidad.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.flu_tra_id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    #{log.flu_tra_id}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {log.flu_tra_orig}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold">
                    <div className="flex items-center gap-2">
                      {log.flu_tra_ref_id}
                      {log.flu_tra_geo && (
                        <a 
                          href={`https://www.google.com/maps?q=${log.lat},${log.lng}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          title="Ver ubicación en el mapa"
                        >
                          <MapPin className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground line-through decoration-red-300">
                        {log.flu_tra_estado_ant || "---"}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                        {log.flu_tra_estado_nue}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.usuario_nombre}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(log.flu_tra_fecha), 'dd/MM/yyyy HH:mm:ss')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
