import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const restricciones = await prisma.restriccionesCampos.findMany({
      orderBy: { tabla: 'asc' }
    });
    return NextResponse.json(restricciones);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener restricciones" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tabla, columna, oculto, editable } = body;

    const nueva = await prisma.restriccionesCampos.create({
      data: {
        tabla,
        columna,
        oculto: !!oculto,
        editable: !!editable
      }
    });

    return NextResponse.json(nueva);
  } catch (error) {
    return NextResponse.json({ error: "Error al crear restricción" }, { status: 500 });
  }
}
