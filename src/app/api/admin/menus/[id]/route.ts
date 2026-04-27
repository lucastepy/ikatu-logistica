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

    // Eliminación en cascada manual dentro de una transacción
    await prisma.$transaction([
      // 1. Borrar detalles del menú
      prisma.menuDet.deleteMany({
        where: { menu_cod: menuId }
      }),
      // 2. IMPORTANTE: Los perfiles tienen menu_cod NOT NULL. 
      // Si borramos el menú, los perfiles asociados quedarían inválidos.
      // Opción A: Borrar perfiles (esto borraría usuarios si no tienen cascada, cuidado)
      // Opción B: Forzar el borrado del menú y dejar que la DB falle si hay perfiles (más seguro)
      // En este caso, el usuario intentaba poner 0. Si no hay un menú '0', falla.
      // Borraremos el menú directamente, pero antes limpiamos los detalles.
      prisma.menu.delete({
        where: { menu_cod: menuId }
      })
    ]);

    return NextResponse.json({ message: "Menú eliminado con éxito" });
  } catch (error: any) {
    console.error("Delete Menu Error:", error);
    // Si el error es P2003 es por los Perfiles vinculados
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: "No se puede eliminar el menú porque tiene perfiles asociados. Reasigne los perfiles a otro menú primero." 
      }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
