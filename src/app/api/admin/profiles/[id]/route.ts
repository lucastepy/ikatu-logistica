import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";

// PUT: Actualizar un perfil
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const perfilCod = parseInt(id);
    const { nombre, menu_cod } = await request.json();

    const updated = await prisma.perfil.update({
      where: { perfil_cod: perfilCod },
      data: {
        perfil_nombre: nombre,
        menu_cod: parseInt(menu_cod)
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
  }
}

// DELETE: Eliminar un perfil
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const perfilCod = parseInt(id);

    // Verificar si hay usuarios vinculados
    const usersCount = await prisma.usuario.count({
      where: { perfil_cod: perfilCod }
    });

    if (usersCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: hay ${usersCount} usuarios vinculados a este perfil.` }, 
        { status: 400 }
      );
    }

    await prisma.perfil.delete({
      where: { perfil_cod: perfilCod }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar perfil" }, { status: 500 });
  }
}
