import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { codigo, descripcion, valor, tenantId } = body;

    const actualizado = await prisma.parametro.update({
      where: { par_id: parseInt(id) },
      data: {
        par_codigo: codigo,
        par_descripcion: descripcion,
        par_valor: valor,
        par_tenantid: parseInt(tenantId || "1")
      }
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("Update Param Error:", error);
    return NextResponse.json({ error: "Error al actualizar parámetro" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.parametro.delete({
      where: { par_id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Param Error:", error);
    return NextResponse.json({ error: "Error al eliminar parámetro" }, { status: 500 });
  }
}
