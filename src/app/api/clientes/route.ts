import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado") || "A";
    
    const clientes = await prisma.cliente.findMany({
      where: {
        cli_estado: estado
      },
      include: {
        tipoDocumento: true
      },
      orderBy: {
        cli_razon_social: 'asc'
      }
    });
    
    return NextResponse.json(clientes);
  } catch (error: any) {
    console.error("Error fetching clientes:", error);
    return NextResponse.json({ error: "Error al obtener clientes: " + error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razonSocial, tipDocId, nroDoc, esContribuyente, telefono, email } = body;

    const nuevoCliente = await prisma.cliente.create({
      data: {
        cli_razon_social: razonSocial,
        cli_tip_doc_id: tipDocId,
        cli_nro_doc: nroDoc,
        cli_es_contribuyente: esContribuyente,
        cli_telefono: telefono,
        cli_email: email,
        cli_estado: 'A'
      }
    });

    return NextResponse.json(nuevoCliente);
  } catch (error: any) {
    console.error("Error creating cliente:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "El número de documento ya existe" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al crear cliente: " + error.message }, { status: 500 });
  }
}
