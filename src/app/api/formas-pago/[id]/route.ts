import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const body = await request.json();
    const { dsc, usuario } = body;
    const id = parseInt(idParam);

    const updated = await (prisma as any).formaPago.update({
      where: { forma_pago_id: id },
      data: {
        forma_pago_dsc: dsc,
        forma_pago_usuario_mod: usuario || "SISTEMA",
        forma_pago_fecha_mod: new Date()
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating forma de pago:", error);
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
    await (prisma as any).formaPago.delete({
      where: { forma_pago_id: id }
    });
    return NextResponse.json({ message: "Registro eliminado" });
  } catch (error: any) {
    console.error("Error deleting forma de pago:", error);
    return NextResponse.json({ error: "Error al eliminar registro: " + error.message }, { status: 500 });
  }
}
