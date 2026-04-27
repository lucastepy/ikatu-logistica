import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const menuId = parseInt(id);
    const menu = await prisma.menu.findUnique({
      where: { menu_cod: menuId },
      include: { detalles: true }
    });
    return NextResponse.json(menu);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const menuId = parseInt(id);
    const body = await request.json();
    const { nombre } = body;

    const updated = await prisma.menu.update({
      where: { menu_cod: menuId },
      data: { menu_nombre: nombre }
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
    const { id } = await params;
    const menuId = parseInt(id);

    // No permitir borrar el menú 1 (es el menú por defecto de rescate)
    if (menuId === 1) {
      return NextResponse.json({ error: "No se puede eliminar el menú principal del sistema." }, { status: 400 });
    }

    // Usamos una transacción para asegurar integridad
    await prisma.$transaction([
      // 1. Reasignar perfiles al menú ID 1 (Rescate)
      prisma.perfil.updateMany({
        where: { menu_cod: menuId },
        data: { menu_cod: 1 }
      }),
      // 2. Borrar el menú. 
      // (menu_det se borrará solo por el CASCADE que configuraste en la DB)
      prisma.menu.delete({
        where: { menu_cod: menuId }
      })
    ]);

    return NextResponse.json({ message: "Menú eliminado y perfiles reasignados al menú principal." });
  } catch (error: any) {
    console.error("Delete Menu Error:", error);
    return NextResponse.json({ error: "Error al eliminar menú: " + error.message }, { status: 500 });
  }
}
