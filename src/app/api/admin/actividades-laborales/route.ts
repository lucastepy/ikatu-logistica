import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const actividades = await prisma.actividadEconomica.findMany({
      orderBy: { act_eco_cod: 'asc' },
      include: {
        _count: { select: { empresas: true } }
      }
    });
    return NextResponse.json(actividades);
  } catch (error) {
    console.error("Error fetching actividades:", error);
    return NextResponse.json({ error: "Error al obtener actividades" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { dsc } = await request.json();

    const actividad = await prisma.actividadEconomica.create({
      data: {
        act_eco_dsc: dsc
      }
    });
    return NextResponse.json(actividad);
  } catch (error) {
    console.error("Error creating actividad:", error);
    return NextResponse.json({ error: "Error al crear actividad" }, { status: 500 });
  }
}
