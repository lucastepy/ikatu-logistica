import { NextResponse } from "next/server";
import { prismaPublic as prisma } from "@/lib/prisma";

// PUT: Editar un ítem específico del menú
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string, item_id: string }> }
) {
  try {
    const { id, item_id } = await params;
    const menuId = parseInt(id);
    const itemCod = parseInt(item_id);
    const { nombre, url, icono, parent, orden, cargar_inicio, estado } = await request.json();

    // Si este ítem se marca como inicio, desactivamos los otros para este menú
    if (cargar_inicio) {
      await prisma.menuDet.updateMany({
        where: { menu_cod: menuId },
        data: { menu_cargar_inicio: false }
      });
    }

    const updatedItem = await prisma.menuDet.update({
      where: {
        menu_cod_menu_det_cod: {
          menu_cod: menuId,
          menu_det_cod: itemCod
        }
      },
      data: {
        menu_det_nombre: nombre,
        menu_det_url: url,
        menu_det_icono: icono,
        menu_det_cod_padre: parent ? parseInt(parent) : null,
        menu_det_estado: estado,
        menu_det_det_orden: orden ? parseInt(orden) : undefined,
        menu_cargar_inicio: cargar_inicio || false
      }
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error editing menu item:", error);
    return NextResponse.json({ error: "Error al editar ítem" }, { status: 500 });
  }
}

// DELETE: Eliminar un ítem
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string, item_id: string }> }
) {
  try {
    const { id, item_id } = await params;
    const menuId = parseInt(id);
    const itemCod = parseInt(item_id);

    // Primero eliminamos los hijos si existen
    await prisma.menuDet.deleteMany({
      where: {
        menu_cod: menuId,
        menu_det_cod_padre: itemCod
      }
    });

    await prisma.menuDet.delete({
      where: {
        menu_cod_menu_det_cod: {
          menu_cod: menuId,
          menu_det_cod: itemCod
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json({ error: "Error al eliminar ítem" }, { status: 500 });
  }
}
