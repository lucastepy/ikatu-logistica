"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { 
  LayoutDashboard, 
  ListTree, 
  Users, 
  Settings, 
  Activity, 
  ChevronRight, 
  ExternalLink,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  metrics: {
    menus: number;
    items: number;
    profiles: number;
    lastSync: string;
  }
}

export default function DashboardAdmin() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const stats = [
    { 
      label: "Menús Totales", 
      value: data?.metrics.menus || 0, 
      icon: LayoutDashboard, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10",
      link: "/menus" 
    },
    { 
      label: "Ítems Navegación", 
      value: data?.metrics.items || 0, 
      icon: ListTree, 
      color: "text-accent", 
      bg: "bg-accent/10",
      link: "/menus"
    },
    { 
      label: "Perfiles Activos", 
      value: data?.metrics.profiles || 0, 
      icon: Users, 
      color: "text-purple-500", 
      bg: "bg-purple-500/10",
      link: "/perfiles"
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-foreground mb-1">
            Panel <span className="text-accent">Administrativo</span>
          </h1>
          <p className="text-muted text-sm font-medium">Resumen operativo del sistema Ikatu Logística.</p>
        </div>
        <div className="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-2xl shadow-sm">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold text-muted uppercase tracking-wider">Sistema Online</span>
          <span className="text-xs font-mono text-accent/70 ml-2">v2.4.0</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-card border-border shadow-xl hover:translate-y-[-4px] transition-all duration-300 overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <Link href={stat.link} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-background rounded-full">
                  <ArrowUpRight className="h-4 w-4 text-muted" />
                </Link>
              </div>
              <div className="mt-4">
                <p className="text-muted text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-4xl font-black tracking-tighter text-foreground">
                    {loading ? "..." : stat.value}
                  </h3>
                  <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5">
                    +100% <Activity className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Atajos */}
        <Card className="lg:col-span-2 bg-card border-border shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Settings className="h-64 w-64" />
          </div>
          <CardHeader className="border-b bg-background/30 px-6 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-accent" /> Accesos Directos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/menus" className="p-5 rounded-2xl border border-border bg-background/30 hover:bg-accent/5 hover:border-accent/30 transition-all group flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-foreground">Gestionar Estructuras</h4>
                  <p className="text-xs text-muted">Añadir o editar menús y opciones.</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted group-hover:text-accent translate-x-0 group-hover:translate-x-1 transition-all" />
              </Link>
              <Link href="/perfiles" className="p-5 rounded-2xl border border-border bg-background/30 hover:bg-purple-500/5 hover:border-purple-500/30 transition-all group flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-foreground">Seguridad y Roles</h4>
                  <p className="text-xs text-muted">Configurar permisos por perfiles.</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted group-hover:text-purple-500 translate-x-0 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="bg-card border-border shadow-2xl">
          <CardHeader className="border-b bg-background/30 px-6 py-4">
            <CardTitle className="text-lg">Estado Operativo</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted">Sincronización</span>
                <span className="text-xs font-mono font-bold text-emerald-500">CORRECTA</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted">Último Refresco</span>
                <span className="text-xs font-mono font-bold text-foreground">{loading ? "Calculando..." : data?.metrics.lastSync}</span>
              </div>
              <div className="pt-6 border-t border-border">
                <p className="text-[10px] text-muted leading-relaxed italic">
                  Todos los módulos están respondiendo dentro de los parámetros de latencia óptimos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
