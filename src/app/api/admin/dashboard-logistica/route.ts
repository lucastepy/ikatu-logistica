import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Usamos métodos nativos de Prisma que ya manejan el esquema correctamente
    const [depositosCount, tiposDepCount, personalCount, unidadesCount, capacidadSum] = await Promise.all([
      (prisma as any).deposito.count(),
      (prisma as any).tipoDeposito.count(),
      (prisma as any).tipoPersonalEntrega.count(),
      (prisma as any).unidadMedida.count(),
      (prisma as any).deposito.aggregate({
        _sum: { deposito_cap_vol_m3: true }
      })
    ]);

    return NextResponse.json({
      metrics: {
        depositos: depositosCount || 0,
        tiposDep: tiposDepCount || 0,
        personalEntrega: personalCount || 0,
        unidades: unidadesCount || 0,
        capacidadTotal: capacidadSum._sum?.deposito_cap_vol_m3 || 0,
        lastUpdate: new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
    });
  } catch (error: any) {
    console.error("Logistics Dashboard SQL Error:", error);
    return NextResponse.json({ 
      error: "Error al obtener métricas de logística",
      details: error.message 
    }, { status: 500 });
  }
}
