import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const menuId = parseInt(id);
    const detalles = await prisma.menuDet.findMany({
      where: { menu_cod: menuId },
      orderBy: [
        { menu_det_cod_padre: 'asc' },
        { menu_det_det_orden: 'asc' }
      ]
    });
    return NextResponse.json(detalles);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener detalles" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const menuId = parseInt(id);
    const body = await request.json();
    
    // Si este es inicio, desactivamos los demás para este menú
    if (body.cargar_inicio) {
      await prisma.menuDet.updateMany({
        where: { menu_cod: menuId },
        data: { menu_cargar_inicio: false }
      });
    }

    const lastItem = await prisma.menuDet.findFirst({
      where: { menu_cod: menuId },
      orderBy: { menu_det_cod: 'desc' }
    });
    const nextCod = (lastItem?.menu_det_cod || 0) + 1;

    const newItem = await prisma.menuDet.create({
      data: {
        menu_cod: menuId,
        menu_det_cod: nextCod,
        menu_det_nombre: body.nombre,
        menu_det_url: body.url,
        menu_det_icono: body.icono,
        menu_det_cod_padre: body.parent ? parseInt(body.parent) : null,
        menu_det_estado: body.estado || "A",
        menu_det_det_orden: body.orden ? parseInt(body.orden) : nextCod,
        menu_cargar_inicio: body.cargar_inicio || false
      }
    });

    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Create Item Error:", error);
    return NextResponse.json({ error: "Error al crear ítem" }, { status: 500 });
  }
}
