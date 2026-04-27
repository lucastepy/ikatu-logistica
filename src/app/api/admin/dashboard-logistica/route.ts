import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [depositos, tiposDep, personalEntrega, unidades] = await Promise.all([
      prisma.deposito.count(),
      prisma.tipoDeposito.count(),
      prisma.tipoPersonalEntrega.count(),
      prisma.unidadMedida.count(),
    ]);

    // Calcular capacidad total instalada de depósitos
    const depositosData = await prisma.deposito.findMany({
      select: { deposito_cap_vol_m3: true }
    });
    
    const capacidadTotal = depositosData.reduce((acc, curr) => {
      return acc + Number(curr.deposito_cap_vol_m3 || 0);
    }, 0);

    return NextResponse.json({
      metrics: {
        depositos,
        tiposDep,
        personalEntrega,
        unidades,
        capacidadTotal,
        lastUpdate: new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
    });
  } catch (error) {
    console.error("Error fetching logistics metrics:", error);
    return NextResponse.json({ error: "Error al obtener métricas de logística" }, { status: 500 });
  }
}
