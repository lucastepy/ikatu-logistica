import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// API consolidada para obtener datos geográficos
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "dep", "dis", "ciu", "bar"

  try {
    if (type === "dep") {
      const data = await prisma.departamento.findMany({ orderBy: { dep_cod: 'asc' } });
      return NextResponse.json(data);
    }
    
    if (type === "dis") {
      const data = await prisma.distrito.findMany({ 
        include: { departamento: true },
        orderBy: [{ dis_dep_cod: 'asc' }, { dis_cod: 'asc' }] 
      });
      return NextResponse.json(data);
    }

    if (type === "ciu") {
      const data = await prisma.ciudad.findMany({ 
        include: { distrito: { include: { departamento: true } } },
        orderBy: [{ ciu_dep_cod: 'asc' }, { ciu_dis_cod: 'asc' }, { ciu_cod: 'asc' }] 
      });
      return NextResponse.json(data);
    }

    if (type === "bar") {
      const data = await prisma.barrio.findMany({ 
        include: { ciudad: { include: { distrito: true } } },
        orderBy: [{ bar_dep_cod: 'asc' }, { bar_dis_cod: 'asc' }, { bar_ciu_cod: 'asc' }, { bar_cod: 'asc' }] 
      });
      return NextResponse.json(data);
    }

    if (type === "zon") {
      const data = await prisma.$queryRaw`
        SELECT 
          zon_id, 
          zon_nombre, 
          zon_color, 
          zon_usuario_alta, 
          zon_fecha_alta,
          ST_AsGeoJSON(zon_poligono)::json as zon_poligono
        FROM zonas
        ORDER BY zon_id ASC
      `;
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === "dep") {
      const last = await prisma.departamento.findFirst({ orderBy: { dep_cod: 'desc' } });
      const nextCod = (last?.dep_cod || 0) + 1;
      const res = await prisma.departamento.create({ data: { dep_cod: nextCod, dep_dsc: data.dsc } });
      return NextResponse.json(res);
    }

    if (type === "dis") {
      const depCod = parseInt(data.depCod);
      const last = await prisma.distrito.findFirst({ 
        where: { dis_dep_cod: depCod },
        orderBy: { dis_cod: 'desc' } 
      });
      const nextCod = (last?.dis_cod || 0) + 1;
      const res = await prisma.distrito.create({ 
        data: { dis_dep_cod: depCod, dis_cod: nextCod, dis_dsc: data.dsc } 
      });
      return NextResponse.json(res);
    }

    if (type === "ciu") {
      const depCod = parseInt(data.depCod);
      const disCod = parseInt(data.disCod);
      const last = await prisma.ciudad.findFirst({ 
        where: { ciu_dep_cod: depCod, ciu_dis_cod: disCod },
        orderBy: { ciu_cod: 'desc' } 
      });
      const nextCod = (last?.ciu_cod || 0) + 1;
      const res = await prisma.ciudad.create({ 
        data: { ciu_dep_cod: depCod, ciu_dis_cod: disCod, ciu_cod: nextCod, ciu_dsc: data.dsc } 
      });
      return NextResponse.json(res);
    }

    if (type === "bar") {
      const depCod = parseInt(data.depCod);
      const disCod = parseInt(data.disCod);
      const ciuCod = parseInt(data.ciuCod);
      const last = await prisma.barrio.findFirst({ 
        where: { bar_dep_cod: depCod, bar_dis_cod: disCod, bar_ciu_cod: ciuCod },
        orderBy: { bar_cod: 'desc' } 
      });
      const nextCod = (last?.bar_cod || 0) + 1;
      const res = await prisma.barrio.create({ 
        data: { bar_dep_cod: depCod, bar_dis_cod: disCod, bar_ciu_cod: ciuCod, bar_cod: nextCod, bar_dsc: data.dsc } 
      });
      return NextResponse.json(res);
    }

    if (type === "zon") {
      const lastZonas: any[] = await prisma.$queryRaw`SELECT zon_id FROM zonas ORDER BY zon_id DESC LIMIT 1`;
      const nextId = (lastZonas[0]?.zon_id || 0) + 1;

      if (data.poligono) {
        await prisma.$executeRaw`
          INSERT INTO zonas (zon_id, zon_nombre, zon_color, zon_usuario_alta, zon_poligono)
          VALUES (
            ${nextId}, 
            ${data.dsc}, 
            ${data.color || "#3498db"}, 
            ${data.usuario || "SISTEMA"}, 
            ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON(${JSON.stringify(data.poligono)})), 4326)
          )
        `;
        return NextResponse.json({ success: true, id: nextId });
      } else {
        await prisma.$executeRaw`
          INSERT INTO zonas (zon_id, zon_nombre, zon_color, zon_usuario_alta)
          VALUES (${nextId}, ${data.dsc}, ${data.color || "#3498db"}, ${data.usuario || "SISTEMA"})
        `;
        return NextResponse.json({ success: true, id: nextId });
      }
    }

    return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json({ error: "Error al crear registro" }, { status: 500 });
  }
}
