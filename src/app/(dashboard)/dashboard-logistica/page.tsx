"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Truck, 
  Warehouse, 
  Package, 
  Users, 
  Activity, 
  ArrowUpRight, 
  BarChart3, 
  Box, 
  Zap,
  MapPin,
  Clock
} from "lucide-react";
import Link from "next/link";

interface DashboardLogisticaData {
  metrics: {
    depositos: number;
    tiposDep: number;
    personalEntrega: number;
    unidades: number;
    capacidadTotal: number;
    lastUpdate: string;
  }
}

export default function DashboardLogistica() {
  const [data, setData] = useState<DashboardLogisticaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard-logistica")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => console.error("Error loading logistics dashboard:", err));
  }, []);

  const stats = [
    { 
      label: "Depósitos Totales", 
      value: data?.metrics?.depositos || 0, 
      icon: Warehouse, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10",
      link: "/depositos",
      desc: "Centros de almacenamiento activos"
    },
    { 
      label: "Personal de Entrega", 
      value: data?.metrics?.personalEntrega || 0, 
      icon: Users, 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10",
      link: "/tipo-personal-entrega",
      desc: "Repartidores y choferes registrados"
    },
    { 
      label: "Capacidad Total", 
      value: `${data?.metrics?.capacidadTotal?.toLocaleString() || 0} m³`, 
      icon: Box, 
      color: "text-amber-500", 
      bg: "bg-amber-500/10",
      link: "/depositos",
      desc: "Volumen total de almacenamiento"
    },
    { 
      label: "Unidades de Medida", 
      value: data?.metrics?.unidades || 0, 
      icon: Zap, 
      color: "text-purple-500", 
      bg: "bg-purple-500/10",
      link: "/unidades-medida",
      desc: "Formatos de carga configurados"
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header Premium - Fondo Claro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden p-8 rounded-3xl bg-white border border-border shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-slate-900">
          <Truck className="h-64 w-64 rotate-12" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/70">Inteligencia Operativa</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tighter mb-1 text-slate-900">
            Dashboard <span className="text-accent">Logística</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Monitoreo en tiempo real de la infraestructura de distribución.</p>
        </div>
        <div className="relative z-10 flex flex-col items-end gap-2">
          <div className="flex items-center gap-3 bg-slate-50 border border-border px-4 py-2 rounded-2xl shadow-sm">
            <Clock className="h-4 w-4 text-accent" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Última Actualización</span>
              <span className="text-xs font-mono font-black text-slate-700">{loading ? "..." : data?.metrics?.lastUpdate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Estadísticas con Efecto Hover Elevado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-white border-border shadow-xl hover:shadow-2xl hover:translate-y-[-6px] transition-all duration-500 group overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-transparent to-slate-500/5 -mr-8 -mt-8 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <Link href={stat.link} className="opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-accent">
                  <ArrowUpRight className="h-5 w-5" />
                </Link>
              </div>

              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-3xl font-black tracking-tighter text-slate-900 group-hover:text-accent transition-colors">
                  {loading ? (
                    <div className="h-8 w-20 bg-slate-100 animate-pulse rounded-md mt-1"></div>
                  ) : stat.value}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium line-clamp-1 opacity-80 group-hover:opacity-100">
                  {stat.desc}
                </p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <Activity className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold">ÓPTIMO</span>
                </div>
                <BarChart3 className="h-4 w-4 text-slate-200 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sección Inferior de Detalle y Accesos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mapa / Distribución (Visual) */}
        <Card className="lg:col-span-2 bg-white border-border shadow-2xl overflow-hidden group">
          <CardHeader className="border-b bg-slate-50/50 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-900">
                  <MapPin className="h-5 w-5 text-accent" /> Distribución de Recursos
                </CardTitle>
                <CardDescription className="text-xs font-medium">Resumen geográfico y de capacidad por zona.</CardDescription>
              </div>
              <Badge variant="outline" className="border-accent/20 bg-accent/5 text-accent font-bold px-3 py-1">REAL-TIME</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 h-full">
              <div className="flex flex-col justify-center items-center p-6 rounded-3xl bg-slate-50 border border-border group-hover:border-accent/20 transition-all">
                 <div className="h-16 w-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 flex items-center justify-center mb-4">
                    <span className="text-lg font-black text-blue-500">85%</span>
                 </div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ocupación</span>
                 <span className="text-xs font-bold text-slate-700">Depósitos Central</span>
              </div>
              <div className="flex flex-col justify-center items-center p-6 rounded-3xl bg-slate-50 border border-border group-hover:border-emerald-200/20 transition-all">
                 <div className="h-16 w-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center mb-4">
                    <span className="text-lg font-black text-emerald-500">12</span>
                 </div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rutas</span>
                 <span className="text-xs font-bold text-slate-700">Activas Hoy</span>
              </div>
              <div className="flex flex-col justify-center items-center p-6 rounded-3xl bg-slate-50 border border-border group-hover:border-purple-200/20 transition-all">
                 <div className="h-16 w-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 flex items-center justify-center mb-4">
                    <span className="text-lg font-black text-purple-500">4.8</span>
                 </div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rating</span>
                 <span className="text-xs font-bold text-slate-700">Entrega Promedio</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panel de Accesos Rápidos - Ahora en Fondo Claro */}
        <Card className="bg-white border-border shadow-2xl overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 px-8 py-6">
            <CardTitle className="text-lg font-black flex items-center gap-2 text-slate-900">
               Configuración Logística
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <QuickLink href="/depositos" label="Gestión de Depósitos" desc="Configuración y capacidad." icon={Warehouse} />
            <QuickLink href="/tipo-depositos" label="Tipos de Depósito" desc="Categorización de centros." icon={Box} />
            <QuickLink href="/tipo-personal-entrega" label="Personal Entrega" desc="Roles de distribución." icon={Truck} />
            <QuickLink href="/unidades-medida" label="Unidades Medida" desc="Estándares de carga." icon={Zap} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickLink({ href, label, desc, icon: Icon }: any) {
  return (
    <Link href={href} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group">
      <div className="p-3 rounded-xl bg-white/5 text-blue-400 group-hover:scale-110 transition-transform">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h4 className="text-sm font-bold">{label}</h4>
        <p className="text-[10px] text-slate-500 font-medium">{desc}</p>
      </div>
    </Link>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={`inline-flex items-center rounded-full text-xs font-bold px-2.5 py-0.5 ${className}`}>
      {children}
    </span>
  );
}
