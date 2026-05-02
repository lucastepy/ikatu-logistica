import { NextResponse } from "next/server";
import { getPrisma, prismaPublic } from "@/lib/prisma";
const prisma = getPrisma("tenant_la_transportadora");

export async function GET() {
  try {
    const data = await prisma.objeto.findMany({
      orderBy: { obj_id: "asc" }
    });

    // Resolver nombres de usuarios
    const emails = Array.from(new Set([
      ...data.map((i: any) => i.obj_usuario_alta),
      ...data.map((i: any) => i.obj_usuario_mod)
    ].filter(Boolean)));

    const users = await prismaPublic.usuario.findMany({
      where: { usuario_email: { in: emails as string[] } },
      select: { usuario_email: true, usuario_nombre: true }
    });

    const userMap = Object.fromEntries(users.map(u => [u.usuario_email, u.usuario_nombre]));

    const enrichedData = data.map((item: any) => ({
      ...item,
      usuario_alta_nombre: userMap[item.obj_usuario_alta] || item.obj_usuario_alta,
      usuario_mod_nombre: item.obj_usuario_mod ? (userMap[item.obj_usuario_mod] || item.obj_usuario_mod) : null
    }));

    return NextResponse.json(enrichedData);
  } catch (error: any) {
    console.error("Error fetching objetos:", error);
    return NextResponse.json({ error: "Error al obtener datos: " + error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom, usuario } = body;

    // Calcular el siguiente ID (+1 del máximo actual)
    const maxItem = await prisma.objeto.aggregate({
      _max: { obj_id: true }
    });
    const nextId = (maxItem._max.obj_id || 0) + 1;

    const created = await prisma.objeto.create({
      data: {
        obj_id: nextId,
        obj_nom: nom,
        obj_usuario_alta: usuario || "SISTEMA"
      }
    });

    return NextResponse.json(created);
  } catch (error: any) {
    console.error("Error creating objeto:", error);
    return NextResponse.json({ error: "Error al crear registro: " + error.message }, { status: 500 });
  }
}
