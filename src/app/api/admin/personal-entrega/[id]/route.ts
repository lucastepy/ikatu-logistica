import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUT: Actualizar personal de entrega
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      nombre, 
      tipo, 
      licencia, 
      cat_licencia, 
      vto_licencia, 
      telefono, 
      direccion, 
      estado, 
      usuario 
    } = body;

    const updated = await prisma.personalEntrega.update({
      where: { per_ent_documento: id },
      data: {
        per_ent_nombre: nombre,
        per_ent_tipo: parseInt(tipo),
        per_ent_licencia: licencia || null,
        per_ent_cat_licencia: cat_licencia || null,
        per_ent_vto_licencia: vto_licencia ? new Date(vto_licencia) : null,
        per_ent_telefono: telefono || null,
        per_ent_direccion: direccion || null,
        per_ent_estado: estado,
        per_ent_usuario_mod: usuario || "SISTEMA",
        per_ent_fecha_mod: new Date()
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating personal-entrega:", error);
    return NextResponse.json({ error: "Error al actualizar registro de personal" }, { status: 500 });
  }
}

// DELETE: Eliminar personal de entrega
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.personalEntrega.delete({
      where: { per_ent_documento: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting personal-entrega:", error);
    return NextResponse.json({ error: "Error al eliminar registro de personal" }, { status: 500 });
  }
}
