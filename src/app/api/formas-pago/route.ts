import { NextResponse } from "next/server";
import { getPrisma, prismaPublic } from "@/lib/prisma";
const prisma = getPrisma("tenant_la_transportadora");

export async function GET() {
  try {
    const data = await prisma.formaPago.findMany({
      orderBy: { forma_pago_id: "asc" }
    });

    // Resolver nombres de usuarios desde el esquema público
    const emails = Array.from(new Set([
      ...data.map(i => i.forma_pago_usuario_alta),
      ...data.map(i => i.forma_pago_usuario_mod)
    ].filter(Boolean)));

    const users = await prismaPublic.usuario.findMany({
      where: { usuario_email: { in: emails as string[] } },
      select: { usuario_email: true, usuario_nombre: true }
    });

    const userMap = Object.fromEntries(users.map(u => [u.usuario_email, u.usuario_nombre]));

    const enrichedData = data.map(item => ({
      ...item,
      usuario_alta_nombre: userMap[item.forma_pago_usuario_alta] || item.forma_pago_usuario_alta,
      usuario_mod_nombre: item.forma_pago_usuario_mod ? (userMap[item.forma_pago_usuario_mod] || item.forma_pago_usuario_mod) : null
    }));

    return NextResponse.json(enrichedData);
  } catch (error) {
    console.error("Error fetching formas de pago:", error);
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dsc, usuario } = body;

    // Calcular el siguiente ID (+1 del máximo actual)
    const maxItem = await prisma.formaPago.aggregate({
      _max: { forma_pago_id: true }
    });
    const nextId = (maxItem._max.forma_pago_id || 0) + 1;

    const created = await prisma.formaPago.create({
      data: {
        forma_pago_id: nextId,
        forma_pago_dsc: dsc,
        forma_pago_usuario_alta: usuario || "SISTEMA"
      }
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Error creating forma de pago:", error);
    return NextResponse.json({ error: "Error al crear registro" }, { status: 500 });
  }
}
