import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, color, usuario, poligono } = body;

    const zid = parseInt(id);

    if (poligono) {
      await prisma.$executeRaw`
        UPDATE zonas 
        SET 
          zon_nombre = ${nombre},
          zon_color = ${color},
          zon_usuario_mod = ${usuario || "SISTEMA"},
          zon_fecha_mod = NOW(),
          zon_poligono = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(poligono)}), 4326)
        WHERE zon_id = ${zid}
      `;
    } else {
      await prisma.zona.update({
        where: { zon_id: zid },
        data: {
          zon_nombre: nombre,
          zon_color: color,
          zon_usuario_mod: usuario || "SISTEMA",
          zon_fecha_mod: new Date()
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating zona:", error);
    return NextResponse.json({ error: "Error al actualizar zona" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.zona.delete({
      where: { zon_id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting zona:", error);
    return NextResponse.json({ error: "Error al eliminar zona. Verifique dependencias." }, { status: 500 });
  }
}
