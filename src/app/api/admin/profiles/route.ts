import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

// GET: Listar todos los perfiles
export async function GET() {
  try {
    const perfiles = await prisma.perfil.findMany({
      include: {
        menu: true,
        _count: { select: { usuarios: true } }
      },
      orderBy: { perfil_cod: 'asc' }
    });
    return NextResponse.json(perfiles);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener perfiles" }, { status: 500 });
  }
}

// POST: Crear un nuevo perfil
export async function POST(request: Request) {
  try {
    const { nombre, menu_cod } = await request.json();
    
    // Buscar el último perfil_cod para autoincremento manual si no es automático en la DB
    const lastPerfil = await prisma.perfil.findFirst({
      orderBy: { perfil_cod: 'desc' }
    });
    const nextCod = (lastPerfil?.perfil_cod || 0) + 1;

    const newPerfil = await prisma.perfil.create({
      data: { 
        perfil_cod: nextCod,
        perfil_nombre: nombre,
        menu_cod: parseInt(menu_cod)
      }
    });
    return NextResponse.json(newPerfil);
  } catch (error) {
    return NextResponse.json({ error: "Error al crear perfil" }, { status: 500 });
  }
}
