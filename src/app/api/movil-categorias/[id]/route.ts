import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
const prisma = getPrisma("tenant_la_transportadora");

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { dsc, usuario } = body;

    const updated = await prisma.movilCategoria.update({
      where: { mov_cat_id: parseInt(id) },
      data: {
        mov_cat_dsc: dsc,
        usuario_mod: usuario || "ADMIN",
        fecha_mod: new Date()
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating movil categoria:", error);
    return NextResponse.json({ error: "Error al actualizar registro" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.movilCategoria.delete({
      where: { mov_cat_id: parseInt(id) }
    });
    return NextResponse.json({ message: "Eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting movil categoria:", error);
    return NextResponse.json({ error: "Error al eliminar registro" }, { status: 500 });
  }
}
