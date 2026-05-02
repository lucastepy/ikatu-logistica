import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { prismaPublic } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "movil";

  try {
    let rawData: any[] = [];
    if (type === "marca") {
      rawData = await prisma.movilMarca.findMany({ orderBy: { mov_mar_nombre: 'asc' } });
    } else if (type === "modelo") {
      rawData = await prisma.movilModelo.findMany({ 
        include: { marca: true },
        orderBy: { mov_mod_nombre: 'asc' } 
      });
    } else if (type === "movil") {
      rawData = await prisma.movil.findMany({
        include: { 
          marca: true, 
          modelo: true,
          categoria: true
        },
        orderBy: { movil_chapa: 'asc' }
      });
    } else {
      return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
    }

    // Resolver nombres de usuarios de auditoría
    const emails = Array.from(new Set([
      ...rawData.map(i => i.mov_mar_usuario_alta || i.mov_mod_usuario_alta || i.movil_usuario_alta),
      ...rawData.map(i => i.mov_mar_usuario_mod || i.mov_mod_usuario_mod || i.movil_usuario_mod)
    ].filter(Boolean)));

    const users = await prismaPublic.usuario.findMany({
      where: { usuario_email: { in: emails as string[] } },
      select: { usuario_email: true, usuario_nombre: true }
    });

    const userMap = Object.fromEntries(users.map(u => [u.usuario_email, u.usuario_nombre]));

    const enrichedData = rawData.map(item => ({
      ...item,
      usuario_alta_nombre: userMap[item.mov_mar_usuario_alta || item.mov_mod_usuario_alta || item.movil_usuario_alta] || (item.mov_mar_usuario_alta || item.mov_mod_usuario_alta || item.movil_usuario_alta),
      usuario_mod_nombre: userMap[item.mov_mar_usuario_mod || item.mov_mod_usuario_mod || item.movil_usuario_mod] || (item.mov_mar_usuario_mod || item.mov_mod_usuario_mod || item.movil_usuario_mod)
    }));

    return NextResponse.json(enrichedData);
  } catch (error) {
    console.error("Error fetching moviles:", error);
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === "marca") {
      const created = await prisma.movilMarca.create({
        data: {
          mov_mar_nombre: data.nombre,
          mov_mar_estado: data.estado || 'A',
          mov_mar_usuario_alta: data.usuario || "SISTEMA"
        }
      });
      return NextResponse.json(created);
    }

    if (type === "modelo") {
      const created = await prisma.movilModelo.create({
        data: {
          mov_mod_nombre: data.nombre,
          mov_mod_marca_id: parseInt(data.marcaId),
          mov_mod_estado: data.estado || 'A',
          mov_mod_usuario_alta: data.usuario || "SISTEMA"
        }
      });
      return NextResponse.json(created);
    }

    if (type === "movil") {
      const created = await prisma.movil.create({
        data: {
          movil_chapa: data.chapa,
          movil_marca_id: parseInt(data.marcaId),
          movil_modelo_id: parseInt(data.modeloId),
          movil_cat_id: data.catId ? parseInt(data.catId) : null,
          movil_anho: data.anho ? parseInt(data.anho) : null,
          movil_tipo: data.tipo || null,
          movil_capacidad_kg: data.capacidad ? parseFloat(data.capacidad) : null,
          movil_km_actual: data.kmActual ? parseInt(data.kmActual) : null,
          movil_vto_seguro: data.vtoSeguro ? new Date(data.vtoSeguro) : null,
          movil_vto_habilitacion: data.vtoHabilitacion ? new Date(data.vtoHabilitacion) : null,
          movil_estado: data.estado || 'A',
          movil_usuario_alta: data.usuario || "SISTEMA"
        }
      });
      return NextResponse.json(created);
    }

    return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
  } catch (error) {
    console.error("Error creating movil resource:", error);
    return NextResponse.json({ error: "Error al crear registro" }, { status: 500 });
  }
}
