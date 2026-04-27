"use client";

import Link from "next/link";
import { Button } from "../components/ui/button";
import { Home, Search, AlertCircle, ArrowLeft } from "lucide-react";

import { useState, useEffect } from "react";

export default function NotFound() {
  const [traceId, setTraceId] = useState("IKATU-000000");

  useEffect(() => {
    // Generar el ID solo en el cliente para evitar mismatch de hidratación
    setTraceId(Math.random().toString(36).substring(7).toUpperCase());
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full"></div>
        <div className="relative bg-card border border-border p-8 rounded-3xl shadow-2xl">
          <AlertCircle className="h-24 w-24 text-accent mx-auto mb-4 stroke-[1.5]" />
          <h1 className="text-8xl font-black tracking-tighter text-foreground leading-none">404</h1>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Ruta No Encontrada</h2>
        <p className="text-muted text-lg">
          Parece que el recurso que buscas ha sido desviado o no se encuentra en nuestros registros logísticos.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-12 w-full max-w-sm">
        <Button asChild className="flex-1 bg-accent hover:brightness-105 text-white font-bold h-12 gap-2 shadow-lg shadow-accent/20">
          <Link href="/">
            <Home className="h-4 w-4" /> Volver al Inicio
          </Link>
        </Button>
        <Button variant="outline" onClick={() => window.history.back()} className="flex-1 border-border h-12 gap-2 hover:bg-background">
          <ArrowLeft className="h-4 w-4" /> Regresar
        </Button>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-8 text-left opacity-50">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-black text-accent mb-1">Status Code</p>
          <p className="font-mono text-sm">HTTP_NOT_FOUND_404</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-black text-accent mb-1">Trace ID</p>
          <p className="font-mono text-sm uppercase">{traceId}</p>
        </div>
      </div>
    </div>
  );
}
