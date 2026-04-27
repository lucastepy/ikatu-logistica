import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cod = parseInt(id);
    const { dsc } = await request.json();

    const unidad = await prisma.unidadMedida.update({
      where: { uni_med_cod: cod },
      data: {
        uni_med_dsc: dsc
      }
    });
    
    return NextResponse.json(unidad);
  } catch (error) {
    console.error("Error updating unidad:", error);
    return NextResponse.json({ error: "Error al actualizar unidad de medida" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cod = parseInt(id);
    
    await prisma.unidadMedida.delete({
      where: { uni_med_cod: cod }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting unidad:", error);
    return NextResponse.json({ error: "Error al eliminar unidad de medida. Podría tener dependencias." }, { status: 500 });
  }
}
