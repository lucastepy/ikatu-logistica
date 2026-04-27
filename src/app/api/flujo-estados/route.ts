import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const data = await (prisma as any).flujoEstado.findMany({
      orderBy: { flu_est_id: "asc" }
    });

    // Resolver nombres de usuarios
    const emails = Array.from(new Set([
      ...data.map((i: any) => i.flu_est_usuario_alta),
      ...data.map((i: any) => i.flu_est_usuario_mod)
    ].filter(Boolean)));

    const users = await prisma.usuario.findMany({
      where: { usuario_email: { in: emails as string[] } },
      select: { usuario_email: true, usuario_nombre: true }
    });

    const userMap = Object.fromEntries(users.map(u => [u.usuario_email, u.usuario_nombre]));

    const enrichedData = data.map((item: any) => ({
      ...item,
      usuario_alta_nombre: userMap[item.flu_est_usuario_alta] || item.flu_est_usuario_alta,
      usuario_mod_nombre: item.flu_est_usuario_mod ? (userMap[item.flu_est_usuario_mod] || item.flu_est_usuario_mod) : null
    }));

    return NextResponse.json(enrichedData);
  } catch (error: any) {
    console.error("Error fetching flujo estados:", error);
    return NextResponse.json({ error: "Error al obtener datos: " + error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom, color, est, usuario } = body;

    // Calcular el siguiente ID (+1 del máximo actual)
    const maxItem = await (prisma as any).flujoEstado.aggregate({
      _max: { flu_est_id: true }
    });
    const nextId = (maxItem._max.flu_est_id || 0) + 1;

    const created = await (prisma as any).flujoEstado.create({
      data: {
        flu_est_id: nextId,
        flu_est_nom: nom,
        flu_est_color_hex: color,
        flu_est_est: est !== undefined ? est : true,
        flu_est_usuario_alta: usuario || "SISTEMA"
      }
    });

    return NextResponse.json(created);
  } catch (error: any) {
    console.error("Error creating flujo estado:", error);
    return NextResponse.json({ error: "Error al crear registro: " + error.message }, { status: 500 });
  }
}
