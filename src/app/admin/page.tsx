"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  ListTree, 
  Users, 
  Settings, 
  Activity, 
  ChevronRight, 
  ArrowUpRight,
  Building2,
  Mail
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
      })
      .catch(() => setLoading(false));
  }, []);

  const stats = [
    { 
      label: "Clientes SaaS", 
      value: "24", // Ejemplo, esto debería venir del API
      icon: Building2, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10",
      link: "/admin/empresa" 
    },
    { 
      label: "Menús Totales", 
      value: data?.metrics?.menus || 0, 
      icon: LayoutDashboard, 
      color: "text-accent", 
      bg: "bg-accent/10",
      link: "/admin/menus" 
    },
    { 
      label: "Perfiles Activos", 
      value: data?.metrics?.profiles || 0, 
      icon: ShieldAlertIcon, 
      color: "text-purple-500", 
      bg: "bg-purple-500/10",
      link: "/admin/perfiles"
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-white mb-1">
            Portal <span className="text-red-500">Súper Admin</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">Panel de control global de la infraestructura Ikatu.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-2xl shadow-sm">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Modo Maestro</span>
          <span className="text-xs font-mono text-red-500/70 ml-2">v2.5.0</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-2xl hover:translate-y-[-4px] transition-all duration-300 overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <Link href={stat.link} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-800 rounded-full">
                  <ArrowUpRight className="h-4 w-4 text-slate-500" />
                </Link>
              </div>
              <div className="mt-4">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-4xl font-black tracking-tighter text-white">
                    {loading ? "..." : stat.value}
                  </h3>
                  <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5">
                    Estable <Activity className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Atajos Rápidos */}
        <Card className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Settings className="h-64 w-64 text-white" />
          </div>
          <CardHeader className="border-b border-slate-800 bg-slate-950/20 px-6 py-4">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Settings className="h-5 w-5 text-red-500" /> Administración Core
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/admin/empresa" className="p-5 rounded-2xl border border-slate-800 bg-slate-950/30 hover:bg-blue-500/5 hover:border-blue-500/30 transition-all group flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-100">Clientes Multi-Tenant</h4>
                  <p className="text-xs text-slate-500">Gestionar bases de datos y accesos.</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-blue-500 translate-x-0 group-hover:translate-x-1 transition-all" />
              </Link>
              <Link href="/admin/users" className="p-5 rounded-2xl border border-slate-800 bg-slate-950/30 hover:bg-red-500/5 hover:border-red-500/30 transition-all group flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-100">Súper Usuarios</h4>
                  <p className="text-xs text-slate-500">Cuentas de administración global.</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-red-500 translate-x-0 group-hover:translate-x-1 transition-all" />
              </Link>
              <Link href="/admin/logs/email" className="p-5 rounded-2xl border border-slate-800 bg-slate-950/30 hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all group flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-100">Logs de Sistema</h4>
                  <p className="text-xs text-slate-500">Auditoría de correos y eventos.</p>
                </div>
                <Mail className="h-5 w-5 text-slate-600 group-hover:text-emerald-500 transition-all" />
              </Link>
              <Link href="/admin/parametros" className="p-5 rounded-2xl border border-slate-800 bg-slate-950/30 hover:bg-orange-500/5 hover:border-orange-500/30 transition-all group flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-100">Variables Globales</h4>
                  <p className="text-xs text-slate-500">Configuración general del SaaS.</p>
                </div>
                <Settings className="h-5 w-5 text-slate-600 group-hover:text-orange-500 transition-all" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Status Master */}
        <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-2xl border-l-4 border-l-red-600">
          <CardHeader className="border-b border-slate-800 bg-slate-950/20 px-6 py-4">
            <CardTitle className="text-lg font-bold text-white">Infraestructura</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Base de Datos Core</span>
                <span className="text-xs font-mono font-bold text-emerald-500">OPERATIVA</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Aislamiento Tenant</span>
                <span className="text-xs font-mono font-bold text-emerald-500">ACTIVO</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Último BackUp</span>
                <span className="text-xs font-mono font-bold text-slate-300">Hace 4h</span>
              </div>
              <div className="pt-6 border-t border-slate-800">
                <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                  <p className="text-[10px] text-red-400 leading-relaxed font-bold uppercase tracking-tighter">
                    Acceso Restringido: Estás operando sobre la configuración maestra del ecosistema Ikatu.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ShieldAlertIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  )
}
