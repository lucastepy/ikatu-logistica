import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const logs = await prisma.segEmailLog.findMany({
      orderBy: { log_fecha: 'desc' },
      take: 100 // Limitamos a los últimos 100 por rendimiento
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener logs de email" }, { status: 500 });
  }
}
