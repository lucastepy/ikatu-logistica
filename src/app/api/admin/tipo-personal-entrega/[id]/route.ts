import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUT: Actualizar un tipo de personal de entrega
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { dsc, est, usuario } = await request.json();

    const updated = await prisma.tipoPersonalEntrega.update({
      where: { tip_per_ent_id: parseInt(id) },
      data: {
        tip_per_ent_dsc: dsc,
        tip_per_ent_est: est,
        tip_per_ent_usuario_mod: usuario || "SISTEMA",
        tip_per_ent_fecha_mod: new Date()
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating tipo-personal-entrega:", error);
    return NextResponse.json({ error: "Error al actualizar tipo de personal de entrega" }, { status: 500 });
  }
}

// DELETE: Eliminar un tipo de personal de entrega
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.tipoPersonalEntrega.delete({
      where: { tip_per_ent_id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tipo-personal-entrega:", error);
    return NextResponse.json({ error: "Error al eliminar tipo de personal de entrega" }, { status: 500 });
  }
}
