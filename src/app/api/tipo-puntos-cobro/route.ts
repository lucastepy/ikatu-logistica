import { NextResponse } from "next/server";
import { getPrisma, prismaPublic } from "@/lib/prisma";
const prisma = getPrisma("tenant_la_transportadora");

export async function GET() {
  try {
    const data = await prisma.tipoPuntoCobro.findMany({
      orderBy: { tip_pun_cob_id: "asc" }
    });

    const emails = Array.from(new Set([
      ...data.map(i => i.usuario_alta),
      ...data.map(i => i.usuario_mod)
    ].filter(Boolean)));

    const users = await prismaPublic.usuario.findMany({
      where: { usuario_email: { in: emails as string[] } },
      select: { usuario_email: true, usuario_nombre: true }
    });

    const userMap = Object.fromEntries(users.map(u => [u.usuario_email, u.usuario_nombre]));

    const enrichedData = data.map(item => ({
      ...item,
      usuario_alta_nombre: userMap[item.usuario_alta] || item.usuario_alta,
      usuario_mod_nombre: item.usuario_mod ? (userMap[item.usuario_mod] || item.usuario_mod) : null
    }));

    return NextResponse.json(enrichedData);
  } catch (error) {
    console.error("Error fetching tipos de puntos de cobro:", error);
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, usuario } = body;

    // Calcular el siguiente ID (+1 del máximo actual)
    const maxItem = await prisma.tipoPuntoCobro.aggregate({
      _max: { tip_pun_cob_id: true }
    });
    const nextId = (maxItem._max.tip_pun_cob_id || 0) + 1;

    const newItem = await prisma.tipoPuntoCobro.create({
      data: {
        tip_pun_cob_id: nextId,
        tip_pun_cob_nombre: nombre,
        usuario_alta: usuario || "ADMIN"
      }
    });

    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Error creating tipo de punto de cobro:", error);
    return NextResponse.json({ error: "Error al crear registro" }, { status: 500 });
  }
}
