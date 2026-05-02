import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
const prisma = getPrisma("tenant_la_transportadora");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orig = searchParams.get("orig");
    const refId = searchParams.get("refId");

    console.log(`Consultando trazabilidad: orig=${orig}, refId=${refId}`);

    let query = `
      SELECT 
        t.flu_tra_id,
        t.flu_tra_orig,
        t.flu_tra_ref_id,
        t.flu_tra_estado_ant,
        t.flu_tra_estado_nue,
        t.flu_tra_fecha,
        t.flu_tra_usuario,
        COALESCE(u.usuario_nombre, t.flu_tra_usuario) as usuario_nombre,
        CASE WHEN t.flu_tra_geo IS NOT NULL THEN public.ST_Y(t.flu_tra_geo::public.geometry) ELSE NULL END as lat, 
        CASE WHEN t.flu_tra_geo IS NOT NULL THEN public.ST_X(t.flu_tra_geo::public.geometry) ELSE NULL END as lng 
      FROM flujo_trazabilidad t
      LEFT JOIN public.usuarios u ON t.flu_tra_usuario = u.usuario_email
      WHERE 1=1
    `;
    const params: any[] = [];

    if (orig) {
      query += ` AND UPPER(TRIM(t.flu_tra_orig)) = UPPER(TRIM($${params.length + 1}))`;
      params.push(orig);
    }
    if (refId) {
      query += ` AND TRIM(t.flu_tra_ref_id) = TRIM($${params.length + 1})`;
      params.push(refId.toString());
    }

    query += ` ORDER BY t.flu_tra_fecha DESC`;

    const logs: any[] = await prisma.$queryRawUnsafe(query, ...params);
    
    console.log(`Registros encontrados: ${logs.length}`);

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("Error en API trazabilidad:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
