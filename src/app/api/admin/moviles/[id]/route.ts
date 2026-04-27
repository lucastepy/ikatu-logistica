import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, data } = body;

    if (type === "marca") {
      const updated = await prisma.movilMarca.update({
        where: { mov_mar_id: parseInt(id) },
        data: {
          mov_mar_nombre: data.nombre,
          mov_mar_estado: data.estado,
          mov_mar_usuario_mod: data.usuario || "SISTEMA",
          mov_mar_fecha_mod: new Date()
        }
      });
      return NextResponse.json(updated);
    }

    if (type === "modelo") {
      const updated = await prisma.movilModelo.update({
        where: { mov_mod_id: parseInt(id) },
        data: {
          mov_mod_nombre: data.nombre,
          mov_mod_marca_id: parseInt(data.marcaId),
          mov_mod_estado: data.estado,
          mov_mod_usuario_mod: data.usuario || "SISTEMA",
          mov_mod_fecha_mod: new Date()
        }
      });
      return NextResponse.json(updated);
    }

    if (type === "movil") {
      const updated = await prisma.movil.update({
        where: { movil_id: parseInt(id) },
        data: {
          movil_chapa: data.chapa,
          movil_marca_id: parseInt(data.marcaId),
          movil_modelo_id: parseInt(data.modeloId),
          movil_cat_id: data.catId ? parseInt(data.catId) : null,
          movil_anho: data.anho ? parseInt(data.anho) : null,
          movil_tipo: data.tipo || null,
          movil_capacidad_kg: data.capacidad ? parseFloat(data.capacidad) : null,
          movil_km_actual: data.kmActual ? parseInt(data.kmActual) : null,
          movil_vto_seguro: data.vtoSeguro ? new Date(data.vtoSeguro) : null,
          movil_vto_habilitacion: data.vtoHabilitacion ? new Date(data.vtoHabilitacion) : null,
          movil_estado: data.estado,
          movil_usuario_mod: data.usuario || "SISTEMA",
          movil_fecha_mod: new Date()
        }
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
  } catch (error) {
    console.error("Error updating movil resource:", error);
    return NextResponse.json({ error: "Error al actualizar registro" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "marca") {
      await prisma.movilMarca.delete({ where: { mov_mar_id: parseInt(id) } });
    } else if (type === "modelo") {
      await prisma.movilModelo.delete({ where: { mov_mod_id: parseInt(id) } });
    } else if (type === "movil") {
      await prisma.movil.delete({ where: { movil_id: parseInt(id) } });
    } else {
      return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting movil resource:", error);
    return NextResponse.json({ error: "Error al eliminar registro. Verifique si tiene dependencias." }, { status: 500 });
  }
}
