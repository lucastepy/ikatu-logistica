import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { razonSocial, tipDocId, nroDoc, esContribuyente, telefono, email, estado } = body;

    const updated = await prisma.cliente.update({
      where: { cli_id: id },
      data: {
        cli_razon_social: razonSocial,
        cli_tip_doc_id: tipDocId,
        cli_nro_doc: nroDoc,
        cli_es_contribuyente: esContribuyente,
        cli_telefono: telefono,
        cli_email: email,
        cli_estado: estado,
        cli_usuario_mod: body.usuario || "SISTEMA",
        cli_fecha_mod: new Date()
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating cliente:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await (prisma as any).cliente.delete({
      where: { cli_id: id }
    });
    return NextResponse.json({ message: "Cliente eliminado" });
  } catch (error: any) {
    console.error("Error deleting cliente:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
