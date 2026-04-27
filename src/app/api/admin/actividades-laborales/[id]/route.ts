import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const { dsc } = await request.json();

    const actividad = await prisma.actividadEconomica.update({
      where: { act_eco_cod: id },
      data: {
        act_eco_dsc: dsc
      }
    });
    
    return NextResponse.json(actividad);
  } catch (error) {
    console.error("Error updating actividad:", error);
    return NextResponse.json({ error: "Error al actualizar actividad" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // Verificar si tiene empresas asociadas
    const empresasCount = await prisma.empresa.count({
      where: { empresa_act_eco: id }
    });

    if (empresasCount > 0) {
      return NextResponse.json({ 
        error: "No se puede eliminar la actividad porque existen empresas vinculadas." 
      }, { status: 400 });
    }

    await prisma.actividadEconomica.delete({
      where: { act_eco_cod: id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting actividad:", error);
    return NextResponse.json({ error: "Error al eliminar actividad" }, { status: 500 });
  }
}
