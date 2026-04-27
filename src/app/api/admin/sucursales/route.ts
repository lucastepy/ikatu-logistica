import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const sucursales = await prisma.sucursal.findMany({
      orderBy: { suc_id: 'asc' },
      include: {
        _count: { select: { usuarios: true } }
      }
    });
    return NextResponse.json(sucursales);
  } catch (error) {
    console.error("Error fetching sucursales:", error);
    return NextResponse.json({ error: "Error al obtener sucursales" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, direccion, telefono, estado, tenantId } = body;

    const sucursal = await prisma.sucursal.create({
      data: {
        suc_nombre: nombre,
        suc_direccion: direccion,
        suc_telefono: telefono,
        suc_estado: estado || 'A',
        suc_tenantid: parseInt(tenantId || "1")
      }
    });
    return NextResponse.json(sucursal);
  } catch (error) {
    console.error("Error creating sucursal:", error);
    return NextResponse.json({ error: "Error al crear sucursal" }, { status: 500 });
  }
}
