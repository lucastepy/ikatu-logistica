import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
const prisma = getPrisma("tenant_la_transportadora");

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const body = await request.json();
    const { nom, usuario } = body;
    const id = parseInt(idParam);

    const updated = await (prisma as any).objeto.update({
      where: { obj_id: id },
      data: {
        obj_nom: nom,
        obj_usuario_mod: usuario || "SISTEMA",
        obj_fecha_mod: new Date()
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating objeto:", error);
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
    await (prisma as any).objeto.delete({
      where: { obj_id: id }
    });
    return NextResponse.json({ message: "Registro eliminado" });
  } catch (error: any) {
    console.error("Error deleting objeto:", error);
    return NextResponse.json({ error: "Error al eliminar registro: " + error.message }, { status: 500 });
  }
}
