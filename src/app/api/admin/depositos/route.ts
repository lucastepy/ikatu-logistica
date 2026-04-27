import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Especificamos los campos para evitar el error de deserialización de la columna 'geometry'
    try {
      const records: any[] = await prisma.$queryRaw`
        SELECT 
          d.deposito_id,
          d.deposito_nombre,
          d.deposito_dep_tipo,
          d.deposito_direccion,
          d.deposito_depa,
          d.deposito_dis,
          d.deposito_ciu,
          d.deposito_bar,
          d.deposito_cap_vol_m3,
          d.deposito_estado,
          t.tipo_dep_dsc,
          ST_X(d.deposito_geo::geometry) as lng,
          ST_Y(d.deposito_geo::geometry) as lat
        FROM depositos d
        LEFT JOIN tipo_depositos t ON d.deposito_dep_tipo = t.tipo_dep_id
        ORDER BY d.deposito_id ASC
      `;
      return NextResponse.json(records);
    } catch (geoError) {
      console.warn("SQL Query failed, likely missing geo column or PostGIS. Falling back to basic fetch.", geoError);
      // Fallback si la columna geo no existe o falla la extensión
      const basicRecords = await prisma.deposito.findMany({
        include: {
          tipo: true,
          departamento: true,
          distrito: true,
          ciudad: true,
          barrio: true
        },
        orderBy: { deposito_id: 'asc' }
      });
      
      return NextResponse.json(basicRecords.map(r => ({
        ...r,
        tipo_dep_dsc: r.tipo?.tipo_dep_dsc || 'N/A'
      })));
    }
  } catch (error: any) {
    console.error("Error en API Depositos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      deposito_id, deposito_nombre, deposito_dep_tipo, deposito_direccion,
      deposito_depa, deposito_dis, deposito_ciu, deposito_bar,
      deposito_cap_vol_m3, deposito_estado, lat, lng 
    } = body;

    const data: any = {
      deposito_id: parseInt(deposito_id),
      deposito_nombre,
      deposito_dep_tipo: parseInt(deposito_dep_tipo),
      deposito_direccion,
      deposito_depa: parseInt(deposito_depa),
      deposito_dis: parseInt(deposito_dis),
      deposito_ciu: parseInt(deposito_ciu),
      deposito_bar: parseInt(deposito_bar),
      deposito_cap_vol_m3: parseFloat(deposito_cap_vol_m3),
      deposito_estado: Boolean(deposito_estado)
    };

    const record = await prisma.deposito.create({ data });

    // Si hay coordenadas, las actualizamos con SQL crudo (Prisma no soporta geometry en create)
    if (lat && lng) {
      await prisma.$executeRaw`
        UPDATE depositos 
        SET deposito_geo = ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)
        WHERE deposito_id = ${parseInt(deposito_id)}
      `;
    }

    return NextResponse.json(record);
  } catch (error: any) {
    console.error("Error al crear deposito:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      deposito_id, deposito_nombre, deposito_dep_tipo, deposito_direccion,
      deposito_depa, deposito_dis, deposito_ciu, deposito_bar,
      deposito_cap_vol_m3, deposito_estado, lat, lng 
    } = body;

    const id = parseInt(deposito_id);

    const record = await prisma.deposito.update({
      where: { deposito_id: id },
      data: {
        deposito_nombre,
        deposito_dep_tipo: parseInt(deposito_dep_tipo),
        deposito_direccion,
        deposito_depa: parseInt(deposito_depa),
        deposito_dis: parseInt(deposito_dis),
        deposito_ciu: parseInt(deposito_ciu),
        deposito_bar: parseInt(deposito_bar),
        deposito_cap_vol_m3: parseFloat(deposito_cap_vol_m3),
        deposito_estado: Boolean(deposito_estado)
      }
    });

    // Actualizar coordenadas
    if (lat && lng) {
      await prisma.$executeRaw`
        UPDATE depositos 
        SET deposito_geo = ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)
        WHERE deposito_id = ${id}
      `;
    }

    return NextResponse.json(record);
  } catch (error: any) {
    console.error("Error al actualizar deposito:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await prisma.deposito.delete({
      where: { deposito_id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al eliminar deposito:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
