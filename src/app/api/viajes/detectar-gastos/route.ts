import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { movilId, depositoId, tipo, selectedIds, formaPagoId } = body;

    const validIds = (selectedIds || []).filter((id: any) => id !== null && id !== undefined);
    if (!movilId || !depositoId || validIds.length === 0) return NextResponse.json([]);

    // 1. Obtener coordenadas de origen y destino
    const origin: any = await prisma.$queryRaw`
      SELECT ST_X(deposito_geo::geometry) as lng, ST_Y(deposito_geo::geometry) as lat 
      FROM depositos WHERE deposito_id = ${parseInt(depositoId)}
    `;

    const dest: any = await prisma.$queryRaw`
      SELECT ST_X(ST_Centroid(ST_Collect(geom))) as lng, ST_Y(ST_Centroid(ST_Collect(geom))) as lat
      FROM (
        ${tipo === 'ZONA' 
          ? Prisma.sql`SELECT zon_poligono::geometry as geom FROM zonas WHERE zon_id IN (${Prisma.join(validIds.map((id: any) => parseInt(id)))})`
          : Prisma.sql`SELECT dir_geolocalizacion::geometry as geom FROM clientes_direcciones WHERE cli_id IN (${Prisma.join(validIds)})`}
      ) sub
    `;

    const startLng = origin[0]?.lng || -57.63591;
    const startLat = origin[0]?.lat || -25.30066;
    const endLng = dest[0]?.lng;
    const endLat = dest[0]?.lat;

    if (!endLng || !endLat) return NextResponse.json([]);

    // 2. Consultar OSRM para obtener la ruta real
    const osrmRes = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
    );
    const osrmData = await osrmRes.json();

    if (!osrmData.routes || osrmData.routes.length === 0) {
      console.warn("No se pudo obtener ruta de OSRM");
      return NextResponse.json([]);
    }

    const routeGeoJSON = JSON.stringify(osrmData.routes[0].geometry);

    // 3. Obtener la categoría del móvil usando SQL directo
    const movilRes: any = await prisma.$queryRaw`
      SELECT movil_cat_id FROM moviles WHERE movil_id = ${parseInt(movilId)}
    `;

    const movilCatId = movilRes[0]?.movil_cat_id;
    if (!movilCatId) return NextResponse.json([]);

    // 4. Buscar peajes cerca de la ruta REAL (margen de 500m)
    const data: any[] = await prisma.$queryRaw`
      SELECT 
        pc.pun_cob_id as id,
        pc.pun_cob_nombre as nombre,
        tpc.tip_pun_cob_nombre as tipo,
        pct.pun_tar_monto as monto
      FROM puntos_cobro pc
      JOIN tipo_puntos_cobro tpc ON pc.pun_cob_tipo = tpc.tip_pun_cob_id
      JOIN punto_cobro_tarifas pct ON pc.pun_cob_id = pct.pun_tar_pun_cob_id
      WHERE pct.pun_tar_mov_cat_id = ${movilCatId}
      ${formaPagoId ? Prisma.sql`AND pct.pun_tar_forma_pago_id = ${parseInt(formaPagoId)}` : Prisma.empty}
      AND ST_DWithin(
        pc.pun_cob_ubicacion::geometry,
        ST_SetSRID(ST_GeomFromGeoJSON(${routeGeoJSON}), 4326),
        0.005 -- Aproximadamente 500 metros de la carretera real
      )
    `;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error al detectar gastos por ruta real:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
