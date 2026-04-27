import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [actividades, departamentos] = await Promise.all([
      prisma.actividadEconomica.findMany({ 
        orderBy: { act_eco_dsc: 'asc' },
        select: { act_eco_cod: true, act_eco_dsc: true }
      }),
      prisma.departamento.findMany({ 
        orderBy: { dep_dsc: 'asc' },
        select: { dep_cod: true, dep_dsc: true }
      })
    ]);

    return NextResponse.json({
      actividades,
      departamentos
    });
  } catch (error) {
    console.error("Error loading aux lists:", error);
    return NextResponse.json({ error: "Error al cargar listas auxiliares" }, { status: 500 });
  }
}
