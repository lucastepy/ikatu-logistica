import { NextResponse } from "next/server";
import { prismaPublic as prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const perfiles = await prisma.perfil.findMany({
      include: {
        menu: true,
        _count: { select: { usuarios: true } }
      }
    });
    return NextResponse.json(perfiles);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener perfiles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { nombre, menu_cod } = await request.json();
    const newPerfil = await prisma.perfil.create({
      data: { 
        perfil_nombre: nombre,
        menu_cod: parseInt(menu_cod)
      }
    });
    return NextResponse.json(newPerfil);
  } catch (error) {
    return NextResponse.json({ error: "Error al crear perfil" }, { status: 500 });
  }
}
