import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { dsc, usuario } = body;

    const updated = await prisma.tipoDocumento.update({
      where: { tip_doc_id: id },
      data: {
        tip_doc_dsc: dsc,
        tip_doc_usuario_mod: usuario || "SISTEMA",
        tip_doc_fecha_mod: new Date()
      }
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating tipo-documento:", error);
    return NextResponse.json({ error: "Error al actualizar registro" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.tipoDocumento.delete({
      where: { tip_doc_id: id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tipo-documento:", error);
    return NextResponse.json({ error: "No se puede eliminar el registro. Puede que tenga dependencias activas." }, { status: 500 });
  }
}
