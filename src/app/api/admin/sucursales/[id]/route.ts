import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const body = await request.json();
    const { nombre, direccion, telefono, estado } = body;

    const sucursal = await prisma.sucursal.update({
      where: { suc_id: id },
      data: {
        suc_nombre: nombre,
        suc_direccion: direccion,
        suc_telefono: telefono,
        suc_estado: estado
      }
    });
    
    return NextResponse.json(sucursal);
  } catch (error) {
    console.error("Error updating sucursal:", error);
    return NextResponse.json({ error: "Error al actualizar sucursal" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    
    // Verificar si tiene usuarios dependientes
    const usuariosCount = await prisma.usuario.count({
      where: { usuario_sucursal: id }
    });

    if (usuariosCount > 0) {
      return NextResponse.json({ 
        error: "No se puede eliminar la sucursal porque tiene usuarios asociados." 
      }, { status: 400 });
    }

    await prisma.sucursal.delete({
      where: { suc_id: id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sucursal:", error);
    return NextResponse.json({ error: "Error al eliminar sucursal" }, { status: 500 });
  }
}
