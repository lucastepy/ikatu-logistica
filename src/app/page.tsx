"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  MapPin, 
  Wallet, 
  ArrowUpRight, 
  TrendingUp 
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8 bg-background min-h-screen text-foreground font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-accent">IKATU</h1>
          <p className="text-muted mt-1 font-medium">Sistema de Gestión de Logística</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Empresas Totales" value="24" icon={<Building2 className="h-5 w-5 text-accent" />} change="+2 esta semana" />
        <KpiCard title="Sucursales Activas" value="156" icon={<MapPin className="h-5 w-5 text-accent" />} change="98% operativa" />
        <KpiCard title="Usuarios del Sistema" value="1,204" icon={<Users className="h-5 w-5 text-accent" />} change="+12 últimos 24h" />
        <KpiCard title="Bolsa Prepago Global" value="₲ 1.2M" icon={<Wallet className="h-5 w-5 text-muted" />} change="Estable" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Access */}
        <Card className="lg:col-span-2 bg-card border-border text-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white border border-border shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-background flex items-center justify-center border border-border/50">
                      <TrendingUp className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold">Empresa {i} - Transacción Operativa</p>
                      <p className="text-xs text-muted font-medium">Hace 15 minutos</p>
                    </div>
                  </div>
                  <span className="text-accent font-mono font-bold">+₲ 50.000.000</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shortcuts */}
        <Card className="bg-card border-border text-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Acceso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ShortcutLink href="/admin/empresa" title="Gestionar Clientes SaaS" />
            <ShortcutLink href="/admin/users" title="Directorio de Usuarios" />
            <ShortcutLink href="/admin/parametros" title="Parámetros del Sistema" />
            <ShortcutLink href="/settings/password" title="Seguridad de Cuenta" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, change }: any) {
  return (
    <Card className="bg-card border-border text-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-default">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted mt-1">{change}</p>
      </CardContent>
    </Card>
  );
}

function ShortcutLink({ href, title }: any) {
  return (
    <Link href={href} className="flex items-center justify-between p-3 rounded-md hover:bg-background border border-transparent hover:border-border transition-all group">
      <span className="text-sm font-medium">{title}</span>
      <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-accent" />
    </Link>
  );
}
