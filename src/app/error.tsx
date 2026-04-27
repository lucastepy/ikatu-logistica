"use client";

import { useEffect } from "react";
import { Button } from "../components/ui/button";
import { RefreshCcw, ShieldAlert, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Application Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full animate-pulse"></div>
        <div className="relative bg-card border border-red-500/30 p-8 rounded-3xl shadow-2xl">
          <ShieldAlert className="h-24 w-24 text-red-500 mx-auto mb-4 stroke-[1.5]" />
          <h1 className="text-6xl font-black tracking-tighter text-foreground leading-none">ERROR</h1>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Falla en el Sistema</h2>
        <p className="text-muted text-lg">
          Hemos detectado una anomalía en la conexión o el procesamiento de datos. Los ingenieros han sido notificados.
        </p>
        <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/10 inline-block">
          <code className="text-[11px] font-mono text-red-400 break-all">
            {error.digest || "ERR_INTERNAL_SERVER_FAIL"}
          </code>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-12 w-full max-w-sm">
        <Button onClick={() => reset()} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold h-12 gap-2 shadow-lg shadow-red-500/20">
          <RefreshCcw className="h-4 w-4" /> Reintentar Operación
        </Button>
        <Button asChild variant="outline" className="flex-1 border-border h-12 gap-2 hover:bg-background">
          <Link href="/">
            <Home className="h-4 w-4" /> Volver al inicio
          </Link>
        </Button>
      </div>
    </div>
  );
}
