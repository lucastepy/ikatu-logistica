import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const body = await request.json();
    const { nom, color, est, usuario } = body;
    const id = parseInt(idParam);

    const updated = await (prisma as any).flujoEstado.update({
      where: { flu_est_id: id },
      data: {
        flu_est_nom: nom,
        flu_est_color_hex: color,
        flu_est_est: est !== undefined ? est : true,
        flu_est_usuario_mod: usuario || "SISTEMA",
        flu_est_fecha_mod: new Date()
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating flujo estado:", error);
    return NextResponse.json({ error: "Error al actualizar registro: " + error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    await (prisma as any).flujoEstado.delete({
      where: { flu_est_id: id }
    });
    return NextResponse.json({ message: "Registro eliminado" });
  } catch (error: any) {
    console.error("Error deleting flujo estado:", error);
    return NextResponse.json({ error: "Error al eliminar registro: " + error.message }, { status: 500 });
  }
}
