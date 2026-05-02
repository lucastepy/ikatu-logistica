import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, data } = body;
    const zid = parseInt(id);

    if (type === "dep") {
      await prisma.$executeRaw`UPDATE departamentos SET dep_dsc = ${data.dsc} WHERE dep_cod = ${zid}`;
      return NextResponse.json({ success: true });
    }

    if (type === "dis") {
      await prisma.$executeRaw`
        UPDATE distritos 
        SET dis_dsc = ${data.dsc}, dis_dep_cod = ${parseInt(data.depCod)} 
        WHERE dis_cod = ${zid}
      `;
      return NextResponse.json({ success: true });
    }

    if (type === "ciu") {
      await prisma.$executeRaw`
        UPDATE ciudades 
        SET ciu_dsc = ${data.dsc}, ciu_dep_cod = ${parseInt(data.depCod)}, ciu_dis_cod = ${parseInt(data.disCod)} 
        WHERE ciu_cod = ${zid}
      `;
      return NextResponse.json({ success: true });
    }

    if (type === "bar") {
      await prisma.$executeRaw`
        UPDATE barrios 
        SET bar_dsc = ${data.dsc}, bar_dep_cod = ${parseInt(data.depCod)}, bar_dis_cod = ${parseInt(data.disCod)}, bar_ciu_cod = ${parseInt(data.ciuCod)} 
        WHERE bar_cod = ${zid}
      `;
      return NextResponse.json({ success: true });
    }

    if (type === "zon") {
      if (data.poligono) {
        await prisma.$executeRaw`
          UPDATE zonas 
          SET 
            zon_nombre = ${data.dsc},
            zon_color = ${data.color},
            zon_usuario_mod = ${data.usuario || "SISTEMA"},
            zon_fecha_mod = NOW(),
            zon_poligono = public.ST_SetSRID(public.ST_Multi(public.ST_GeomFromGeoJSON(${JSON.stringify(data.poligono)})), 4326)
          WHERE zon_id = ${zid}
        `;
      } else {
        await prisma.$executeRaw`
          UPDATE zonas 
          SET 
            zon_nombre = ${data.dsc},
            zon_color = ${data.color},
            zon_usuario_mod = ${data.usuario || "SISTEMA"},
            zon_fecha_mod = NOW()
          WHERE zon_id = ${zid}
        `;
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json({ error: "Error al actualizar registro" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const zid = parseInt(id);

    if (type === "dep") {
      await prisma.$executeRaw`DELETE FROM departamentos WHERE dep_cod = ${zid}`;
    } else if (type === "dis") {
      await prisma.$executeRaw`DELETE FROM distritos WHERE dis_cod = ${zid}`;
    } else if (type === "ciu") {
      await prisma.$executeRaw`DELETE FROM ciudades WHERE ciu_cod = ${zid}`;
    } else if (type === "bar") {
      await prisma.$executeRaw`DELETE FROM barrios WHERE bar_cod = ${zid}`;
    } else if (type === "zon") {
      await prisma.$executeRaw`DELETE FROM zonas WHERE zon_id = ${zid}`;
    } else {
      return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json({ error: "Error al eliminar registro. Verifique dependencias activas." }, { status: 500 });
  }
}
