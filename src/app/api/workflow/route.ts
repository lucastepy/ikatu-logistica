import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const objId = searchParams.get("objId");

    const where = objId ? { flu_conf_obj_id: parseInt(objId) } : {};

    const data = await prisma.flujoEstadoConfig.findMany({
      where,
      include: {
        objeto: true,
        perfil: true,
        estado_actual: true,
        estado_sig: true
      },
      orderBy: { flu_conf_id: "asc" }
    });

    // Resolver nombres de usuarios
    const emails = Array.from(new Set([
      ...data.map((i: any) => i.flu_conf_usuario_alta),
      ...data.map((i: any) => i.flu_conf_usuario_mod)
    ].filter(Boolean)));

    const users = await prisma.usuario.findMany({
      where: { usuario_email: { in: emails as string[] } },
      select: { usuario_email: true, usuario_nombre: true }
    });

    const userMap = Object.fromEntries(users.map(u => [u.usuario_email, u.usuario_nombre]));

    const enrichedData = data.map((item: any) => ({
      ...item,
      usuario_alta_nombre: userMap[item.flu_conf_usuario_alta] || item.flu_conf_usuario_alta,
      usuario_mod_nombre: item.flu_conf_usuario_mod ? (userMap[item.flu_conf_usuario_mod] || item.flu_conf_usuario_mod) : null
    }));

    return NextResponse.json(enrichedData);
  } catch (error: any) {
    console.error("Error fetching workflow config:", error);
    return NextResponse.json({ error: "Error al obtener datos: " + error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { objId, perfilCod, estActId, estSigId, esInicial, etiqueta, usuario } = body;

    // Calcular el siguiente ID (+1 del máximo actual)
    const maxItem = await prisma.flujoEstadoConfig.aggregate({
      _max: { flu_conf_id: true }
    });
    const nextId = (maxItem._max.flu_conf_id || 0) + 1;

    const created = await prisma.flujoEstadoConfig.create({
      data: {
        flu_conf_id: nextId,
        flu_conf_obj_id: parseInt(objId),
        flu_conf_perfil_cod: parseInt(perfilCod),
        flu_conf_id_estado_actual: estActId ? parseInt(estActId) : null,
        flu_conf_id_estado_siguiente: parseInt(estSigId),
        flu_conf_es_estado_inicial: esInicial || false,
        flu_conf_etiqueta_accion: etiqueta,
        flu_conf_usuario_alta: usuario || "SISTEMA"
      }
    });

    return NextResponse.json(created);
  } catch (error: any) {
    console.error("Error creating workflow config:", error);
    return NextResponse.json({ error: "Error al crear registro: " + error.message }, { status: 500 });
  }
}
