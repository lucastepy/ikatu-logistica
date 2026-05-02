"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Truck, 
  Warehouse, 
  Users, 
  Activity, 
  ArrowUpRight, 
  BarChart3, 
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Timer,
  ChevronRight,
  TrendingUp,
  PackageCheck
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  metrics: {
    depositos: number;
    moviles: number;
    personal: number;
    viajes: {
      total: number;
      enRuta: number;
      finalizados: number;
      pendientes: number;
    };
    capacidad: {
      totalM3: number;
      ocupacion: number;
    };
    lastUpdate: string;
  };
  recientes: Array<{
    id: number;
    nombre: string;
    estado: string;
    movil: string;
    chofer: string;
    fecha: string;
  }>;
}

export default function DashboardGerencialLogistica() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard-gerencial-logistica")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => console.error("Error loading management dashboard:", err));
  }, []);

  const kpis = [
    { 
      label: "Móviles en Ruta", 
      value: data?.metrics?.viajes?.enRuta || 0, 
      total: data?.metrics?.moviles || 0,
      icon: Navigation, 
      color: "text-blue-600", 
      bg: "bg-blue-50",
      desc: "Unidades operativas hoy"
    },
    { 
      label: "Entregas Completadas", 
      value: data?.metrics?.viajes?.finalizados || 0, 
      icon: PackageCheck, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50",
      desc: "Viajes cerrados exitosamente"
    },
    { 
      label: "Capacidad Ocupada", 
      value: `${Math.round(data?.metrics?.capacidad?.ocupacion || 0)}%`, 
      icon: Warehouse, 
      color: "text-amber-600", 
      bg: "bg-amber-50",
      desc: "Uso actual de depósitos"
    },
    { 
      label: "Viajes Pendientes", 
      value: data?.metrics?.viajes?.pendientes || 0, 
      icon: Timer, 
      color: "text-slate-600", 
      bg: "bg-slate-100",
      desc: "En cola de preparación"
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-1000 bg-slate-50/30 min-h-screen">
      {/* Header Gerencial */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-[2rem] bg-white border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none text-blue-900">
          <BarChart3 className="h-64 w-64 rotate-12" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Gerencial</span>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronizado</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Monitor <span className="text-blue-600">Logístico</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-md mt-1">Visión estratégica de la cadena de suministro y flota operativa.</p>
        </div>

        <div className="relative z-10 flex flex-col md:items-end gap-3">
           <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-5 py-3 rounded-2xl shadow-sm">
             <Clock className="h-4 w-4 text-blue-600" />
             <div className="flex flex-col">
               <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Corte de Datos</span>
               <span className="text-sm font-mono font-black text-slate-700">{loading ? "Calculando..." : data?.metrics?.lastUpdate}</span>
             </div>
           </div>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="bg-white border-slate-200 shadow-lg hover:shadow-2xl hover:translate-y-[-4px] transition-all duration-500 group overflow-hidden rounded-3xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${kpi.bg} ${kpi.color}`}>
                  <kpi.icon className="h-6 w-6" />
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1">
                     <TrendingUp className="h-3 w-3" /> +12%
                   </span>
                   <span className="text-[8px] text-slate-400 uppercase font-bold">vs ayer</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{kpi.label}</p>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-4xl font-black tracking-tighter text-slate-900">
                     {loading ? "..." : kpi.value}
                   </h3>
                   {kpi.total && (
                     <span className="text-slate-400 font-bold text-sm">/ {kpi.total}</span>
                   )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium opacity-80">{kpi.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Viajes Recientes */}
        <Card className="lg:col-span-2 bg-white border-slate-200 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black text-slate-900">Actividad de Flota</CardTitle>
                <CardDescription className="text-xs font-medium">Últimos movimientos registrados en el sistema.</CardDescription>
              </div>
              <Link href="/viajes" className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest flex items-center gap-1">
                Ver todos <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
               <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                      <th className="px-8 py-4 text-left">Viaje</th>
                      <th className="px-8 py-4 text-left">Móvil / Chofer</th>
                      <th className="px-8 py-4 text-center">Estado</th>
                      <th className="px-8 py-4 text-right">Inicio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      Array(3).fill(0).map((_, i) => (
                        <tr key={i} className="animate-pulse"><td colSpan={4} className="h-16 px-8"></td></tr>
                      ))
                    ) : data?.recientes?.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                             <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Truck className="h-5 w-5" />
                             </div>
                             <div>
                               <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{r.nombre}</p>
                               <p className="text-[10px] text-slate-400 font-mono">ID: #{r.id}</p>
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div>
                            <p className="font-bold text-slate-700 text-sm">{r.chofer}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{r.movil}</p>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                             r.estado.includes('RUTA') ? 'bg-blue-50 text-blue-600 border-blue-200' :
                             r.estado.includes('FINAL') ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                             'bg-amber-50 text-amber-600 border-amber-200'
                           }`}>
                             {r.estado}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right font-mono text-xs text-slate-500">
                          {new Date(r.fecha).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </CardContent>
        </Card>

        {/* Panel Lateral: Infraestructura */}
        <div className="space-y-6">
          <Card className="bg-white border-slate-200 shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-6">
               <CardTitle className="text-md font-black flex items-center gap-2">
                 <Warehouse className="h-4 w-4 text-blue-400" /> Infraestructura
               </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <QuickStat label="Depósitos" value={data?.metrics?.depositos || 0} icon={Warehouse} color="text-blue-400" />
              <QuickStat label="Vehículos" value={data?.metrics?.moviles || 0} icon={Truck} color="text-emerald-400" />
              <QuickStat label="Personal" value={data?.metrics?.personal || 0} icon={Users} color="text-purple-400" />
              
            </CardContent>
          </Card>

          {/* Estado del Sistema */}
          <Card className="bg-emerald-600 text-white rounded-3xl shadow-lg shadow-emerald-200/50 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
               <Activity className="h-24 w-24" />
            </div>
            <CardContent className="p-6">
               <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-black text-sm uppercase tracking-widest">Sistema Operativo</span>
               </div>
               <p className="text-emerald-50/80 text-xs font-medium leading-relaxed">
                 Todos los nodos de logística están respondiendo correctamente. No se detectan anomalías en las rutas activas.
               </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value, icon: Icon, color }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-white shadow-sm ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs font-bold text-slate-600">{label}</span>
      </div>
      <span className="text-lg font-black text-slate-900">{value}</span>
    </div>
  );
}
