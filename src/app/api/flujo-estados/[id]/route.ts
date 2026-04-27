import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const estadoId = parseInt(idParam);
    const body = await request.json();
    const { nombre, color, estado, usuario } = body;

    const updated = await prisma.flujoEstado.update({
      where: { flu_est_id: estadoId },
      data: {
        flu_est_nom: nombre,
        flu_est_color_hex: color,
        flu_est_est: estado,
        flu_est_usuario_mod: usuario,
        flu_est_fecha_mod: new Date()
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const estadoId = parseInt(idParam);
    await prisma.flujoEstado.delete({
      where: { flu_est_id: estadoId }
    });
    return NextResponse.json({ message: "Estado eliminado" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
