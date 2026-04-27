import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

// GET: Listar todos los menús
export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      orderBy: { menu_cod: 'asc' },
      include: {
        detalles: {
          orderBy: { menu_det_det_orden: 'asc' }
        },
        _count: {
          select: { detalles: true, perfiles: true }
        }
      }
    });
    return NextResponse.json(menus);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener menús" }, { status: 500 });
  }
}

// POST: Crear un nuevo menú
export async function POST(request: Request) {
  try {
    const { nombre } = await request.json();

    // Buscar el último ID para el contador manual
    const lastMenu = await prisma.menu.findFirst({
      orderBy: { menu_cod: 'desc' }
    });
    
    const nextCod = (lastMenu?.menu_cod || 0) + 1;

    const newMenu = await prisma.menu.create({
      data: { 
        menu_cod: nextCod,
        menu_nombre: nombre 
      }
    });
    
    return NextResponse.json(newMenu);
  } catch (error: any) {
    console.error("Create Menu Error:", error);
    return NextResponse.json({ error: "Error al crear menú", details: error.message }, { status: 500 });
  }
}
