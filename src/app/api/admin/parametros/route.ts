import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const params = await prisma.parametro.findMany({
      orderBy: { par_codigo: 'asc' }
    });
    return NextResponse.json(params);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener parámetros" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { codigo, descripcion, valor, tenantId } = body;

    const nuevo = await prisma.parametro.create({
      data: {
        par_codigo: codigo,
        par_descripcion: descripcion,
        par_valor: valor,
        par_tenantid: parseInt(tenantId || "1")
      }
    });

    return NextResponse.json(nuevo);
  } catch (error) {
    console.error("Create Param Error:", error);
    return NextResponse.json({ error: "Error al crear parámetro" }, { status: 500 });
  }
}
