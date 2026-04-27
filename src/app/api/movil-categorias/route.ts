import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.movilCategoria.findMany({
      orderBy: { mov_cat_id: "asc" }
    });

    // Obtener todos los emails únicos de auditoría
    const emails = Array.from(new Set([
      ...data.map(i => i.usuario_alta),
      ...data.map(i => i.usuario_mod)
    ].filter(Boolean)));

    // Buscar los nombres de esos usuarios
    const users = await prisma.usuario.findMany({
      where: { usuario_email: { in: emails as string[] } },
      select: { usuario_email: true, usuario_nombre: true }
    });

    // Crear un mapa de email -> nombre
    const userMap = Object.fromEntries(users.map(u => [u.usuario_email, u.usuario_nombre]));

    // Adjuntar nombres a los datos
    const enrichedData = data.map(item => ({
      ...item,
      usuario_alta_nombre: userMap[item.usuario_alta] || item.usuario_alta,
      usuario_mod_nombre: item.usuario_mod ? (userMap[item.usuario_mod] || item.usuario_mod) : null
    }));

    return NextResponse.json(enrichedData);
  } catch (error) {
    console.error("Error fetching movil categorias:", error);
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dsc, usuario } = body;

    const maxItem = await prisma.movilCategoria.aggregate({
      _max: { mov_cat_id: true }
    });
    const nextId = (maxItem._max.mov_cat_id || 0) + 1;

    const newItem = await prisma.movilCategoria.create({
      data: {
        mov_cat_id: nextId,
        mov_cat_dsc: dsc,
        usuario_alta: usuario || "ADMIN"
      }
    });

    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Error creating movil categoria:", error);
    return NextResponse.json({ error: "Error al crear registro" }, { status: 500 });
  }
}
