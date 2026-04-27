import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();
    const { razonSocial, tipDocId, nroDoc, esContribuyente, telefono, email, estado } = body;

    const clienteActualizado = await prisma.cliente.update({
      where: { cli_id: id },
      data: {
        cli_razon_social: razonSocial,
        cli_tip_doc_id: tipDocId,
        cli_nro_doc: nroDoc,
        cli_es_contribuyente: esContribuyente,
        cli_telefono: telefono,
        cli_email: email,
        cli_estado: estado
      }
    });

    return NextResponse.json(clienteActualizado);
  } catch (error: any) {
    console.error("Error updating cliente:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "El número de documento ya existe" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // Borrado lógico: Actualizamos el estado a 'I'
    const clienteEliminado = await prisma.cliente.update({
      where: { cli_id: id },
      data: {
        cli_estado: 'I'
      }
    });

    return NextResponse.json({ message: "Cliente desactivado correctamente", cliente: clienteEliminado });
  } catch (error) {
    console.error("Error deleting cliente:", error);
    return NextResponse.json({ error: "Error al eliminar cliente" }, { status: 500 });
  }
}
