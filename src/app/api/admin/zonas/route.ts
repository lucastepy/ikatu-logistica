import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Usamos queryRaw para obtener la geometría como GeoJSON
    const data = await prisma.$queryRaw`
      SELECT 
        zon_id, 
        zon_nombre, 
        zon_color, 
        zon_usuario_alta, 
        zon_fecha_alta,
        public.ST_AsGeoJSON(zon_poligono)::json as zon_poligono
      FROM zonas
      ORDER BY zon_id ASC
    `;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching zonas:", error);
    return NextResponse.json({ error: "Error al obtener zonas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, color, usuario, poligono } = body;

    // Obtener el último ID para el autoincremento manual
    const lastZona = await prisma.zona.findFirst({
      orderBy: { zon_id: 'desc' }
    });
    const nextId = (lastZona?.zon_id || 0) + 1;

    // Insertar con geometría si viene el polígono
    if (poligono) {
      await prisma.$executeRaw`
        INSERT INTO zonas (zon_id, zon_nombre, zon_color, zon_usuario_alta, zon_poligono)
        VALUES (
          ${nextId}, 
          ${nombre}, 
          ${color || "#3498db"}, 
          ${usuario || "SISTEMA"}, 
          public.ST_SetSRID(public.ST_GeomFromGeoJSON(${JSON.stringify(poligono)}), 4326)
        )
      `;
    } else {
      await prisma.zona.create({
        data: {
          zon_id: nextId,
          zon_nombre: nombre,
          zon_color: color || "#3498db",
          zon_usuario_alta: usuario || "SISTEMA"
        }
      });
    }

    return NextResponse.json({ success: true, id: nextId });
  } catch (error) {
    console.error("Error creating zona:", error);
    return NextResponse.json({ error: "Error al crear zona" }, { status: 500 });
  }
}
