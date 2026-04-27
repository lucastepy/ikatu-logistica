import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const unidades = await prisma.unidadMedida.findMany({
      orderBy: { uni_med_cod: 'asc' }
    });
    return NextResponse.json(unidades);
  } catch (error) {
    console.error("Error fetching unidades:", error);
    return NextResponse.json({ error: "Error al obtener unidades de medida" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dsc } = body;

    if (!dsc) {
      return NextResponse.json({ error: "La descripción es requerida" }, { status: 400 });
    }

    // Calcular el siguiente código (MAX + 1)
    const lastItem = await prisma.unidadMedida.findFirst({
      orderBy: { uni_med_cod: 'desc' }
    });
    const nextCod = (lastItem?.uni_med_cod || 0) + 1;

    const unidad = await prisma.unidadMedida.create({
      data: {
        uni_med_cod: nextCod,
        uni_med_dsc: dsc,
        uni_med_usuario_alta: "Admin"
      }
    });
    return NextResponse.json(unidad);
  } catch (error) {
    console.error("Error creating unidad:", error);
    return NextResponse.json({ error: "Error al crear unidad de medida." }, { status: 500 });
  }
}
