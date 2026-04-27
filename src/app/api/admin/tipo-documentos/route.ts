import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const data = await prisma.tipoDocumento.findMany({
      orderBy: { tip_doc_dsc: 'asc' }
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching tipo-documentos:", error);
    return NextResponse.json({ error: "Error al obtener tipos de documentos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, dsc, usuario } = body;

    // Verificar si ya existe el ID
    const existing = await prisma.tipoDocumento.findUnique({
      where: { tip_doc_id: id }
    });

    if (existing) {
      return NextResponse.json({ error: "El código ya existe" }, { status: 400 });
    }

    const created = await prisma.tipoDocumento.create({
      data: {
        tip_doc_id: id,
        tip_doc_dsc: dsc,
        tip_doc_usuario_alta: usuario || "SISTEMA"
      }
    });
    return NextResponse.json(created);
  } catch (error) {
    console.error("Error creating tipo-documento:", error);
    return NextResponse.json({ error: "Error al crear registro" }, { status: 500 });
  }
}
