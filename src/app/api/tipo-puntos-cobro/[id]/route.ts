import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, usuario } = body;

    const updated = await prisma.tipoPuntoCobro.update({
      where: { tip_pun_cob_id: parseInt(id) },
      data: {
        tip_pun_cob_nombre: nombre,
        usuario_mod: usuario || "ADMIN",
        fecha_mod: new Date()
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating tipo de punto de cobro:", error);
    return NextResponse.json({ error: "Error al actualizar registro" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.tipoPuntoCobro.delete({
      where: { tip_pun_cob_id: parseInt(id) }
    });
    return NextResponse.json({ message: "Eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting tipo de punto de cobro:", error);
    return NextResponse.json({ error: "Error al eliminar registro" }, { status: 500 });
  }
}
