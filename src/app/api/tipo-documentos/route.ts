import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
const prisma = getPrisma("tenant_la_transportadora");

export async function GET() {
  try {
    const tipos = await prisma.tipoDocumento.findMany({
      orderBy: {
        tip_doc_dsc: 'asc'
      }
    });
    return NextResponse.json(tipos);
  } catch (error) {
    console.error("Error fetching tipo_documentos:", error);
    return NextResponse.json({ error: "Error al obtener tipos de documentos" }, { status: 500 });
  }
}
