"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Layout, UserCircle, Plus, Settings2 } from "lucide-react";

interface Perfil {
  perfil_cod: number;
  perfil_nombre: string;
  menu_cod: number;
  menu: {
    menu_nombre: string;
  };
  _count: {
    usuarios: number;
  };
}

export default function PerfilesPage() {
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/perfiles")
      .then(res => res.json())
      .then(data => {
        setPerfiles(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Perfiles de Usuario</h1>
          <p className="text-muted mt-1">Administra los roles y sus permisos de navegación.</p>
        </div>
        <Button className="bg-accent hover:brightness-105 text-white font-bold shadow-lg flex gap-2">
          <Plus className="h-4 w-4" /> Nuevo Perfil
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="col-span-full text-center py-10 text-muted italic">Cargando perfiles...</p>
        ) : perfiles.map((perfil) => (
          <Card key={perfil.perfil_cod} className="bg-card border-border shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="p-2 rounded-lg bg-accent/10">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <Badge variant="outline" className="border-accent/20 bg-accent/5 text-accent font-bold">
                ID: {perfil.perfil_cod}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <CardTitle className="text-xl font-bold group-hover:text-accent transition-colors">
                  {perfil.perfil_nombre}
                </CardTitle>
                <div className="flex items-center gap-2 mt-4 p-3 rounded-md bg-background border border-border">
                  <Layout className="h-4 w-4 text-muted" />
                  <div className="text-xs">
                    <span className="text-muted block uppercase tracking-tighter font-bold">Menú Asignado</span>
                    <span className="text-foreground font-semibold">{perfil.menu.menu_nombre}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-dashed border-border">
                <div className="flex items-center gap-2 text-muted">
                  <UserCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">{perfil._count.usuarios} usuarios</span>
                </div>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-accent hover:bg-accent/10 font-bold">
                  <Settings2 className="h-3.5 w-3.5" /> Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
