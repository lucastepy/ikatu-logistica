"use client";

import Link from "next/link";
import { Button } from "../components/ui/button";
import { Home, AlertCircle, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

export default function NotFound() {
  const [traceId, setTraceId] = useState("IKATU-000000");

  useEffect(() => {
    setTraceId(Math.random().toString(36).substring(7).toUpperCase());
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/30 px-4 text-center animate-in fade-in duration-700">
      
      {/* Tarjeta Central 404 */}
      <div className="relative mb-12">
        <div className="bg-white p-12 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 flex flex-col items-center gap-6 w-64 md:w-72">
          <div className="h-24 w-24 rounded-full bg-accent/5 flex items-center justify-center text-accent">
            <AlertCircle className="h-16 w-16 stroke-[1.5]" />
          </div>
          <h1 className="text-8xl font-black tracking-tighter text-slate-800 leading-none">
            404
          </h1>
        </div>
      </div>

      {/* Textos Informativos */}
      <div className="max-w-lg space-y-4">
        <h2 className="text-4xl font-bold tracking-tight text-slate-800">
          Ruta No Encontrada
        </h2>
        <p className="text-slate-500 text-lg font-medium max-w-sm mx-auto leading-relaxed">
          Parece que el recurso que buscas ha sido desviado o no se encuentra en nuestros registros logísticos.
        </p>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row gap-5 mt-14 w-full max-w-md px-4">
        <Button asChild className="flex-1 bg-accent hover:brightness-105 text-white font-bold h-14 rounded-2xl gap-3 shadow-xl shadow-accent/20 border-none transition-all active:scale-95">
          <Link href="/">
            <Home className="h-5 w-5" /> Volver al Inicio
          </Link>
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.history.back()} 
          className="flex-1 bg-white border-slate-100 h-14 rounded-2xl gap-3 text-slate-600 font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" /> Regresar
        </Button>
      </div>

      {/* Footer Técnico (Status & Trace) */}
      <div className="mt-20 flex gap-16 text-left opacity-40">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-black text-accent mb-2">Status Code</p>
          <p className="font-mono text-xs font-bold text-slate-600 tracking-tight">HTTP_NOT_FOUND_404</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-black text-accent mb-2">Trace ID</p>
          <p className="font-mono text-xs font-bold text-slate-600 tracking-tight uppercase">{traceId}</p>
        </div>
      </div>
    </div>
  );
}
