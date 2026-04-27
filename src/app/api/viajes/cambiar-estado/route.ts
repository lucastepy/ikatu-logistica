import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const viaId = searchParams.get("viaId");
    if (!viaId) return NextResponse.json([]);

    const viaje: any = (await prisma.$queryRaw`SELECT via_estado FROM viajes WHERE via_id = ${parseInt(viaId)}` as any[])[0];
    if (!viaje) return NextResponse.json([]);

    const estadoActual = (viaje.via_estado || "").toString().trim().toUpperCase();
    const objeto: any = (await prisma.$queryRaw`SELECT obj_id FROM objetos WHERE obj_nom ILIKE '%viaje%' ORDER BY obj_id ASC LIMIT 1` as any[])[0];
    if (!objeto) return NextResponse.json([]);

    let transiciones: any[] = await prisma.$queryRaw`
      SELECT 
        fec.flu_conf_id as id,
        fec.flu_conf_etiqueta_accion as accion,
        fe.flu_est_id as "estadoSiguienteId",
        fe.flu_est_nom as "estadoSiguienteNom"
      FROM flujo_estados_config fec
      JOIN flujo_estados fe ON fec.flu_conf_id_estado_siguiente = fe.flu_est_id
      LEFT JOIN flujo_estados fe_act ON fec.flu_conf_id_estado_actual = fe_act.flu_est_id
      WHERE fec.flu_conf_obj_id = ${objeto.obj_id}
        AND (
          CAST(fec.flu_conf_id_estado_actual AS TEXT) = ${estadoActual}
          OR UPPER(TRIM(fe_act.flu_est_nom)) = ${estadoActual}
        )
    `;

    if (transiciones.length === 0 && (estadoActual === "" || estadoActual === "0" || estadoActual === "1")) {
       transiciones = await prisma.$queryRaw`
        SELECT 
          fec.flu_conf_id as id,
          fec.flu_conf_etiqueta_accion as accion,
          fe.flu_est_id as "estadoSiguienteId"
        FROM flujo_estados_config fec
        JOIN flujo_estados fe ON fec.flu_conf_id_estado_siguiente = fe.flu_est_id
        WHERE fec.flu_conf_obj_id = ${objeto.obj_id}
          AND fec.flu_conf_es_estado_inicial = true
      `;
    }

    return NextResponse.json(transiciones);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { viaId, nuevoEstadoId, usuario, lat, lng } = body;
    const userEmail = usuario || "SISTEMA";

    // 1. Obtener estado actual
    const viajeActual: any = (await prisma.$queryRaw`
      SELECT v.via_estado, COALESCE(fe.flu_est_nom, v.via_estado) as via_estado_nombre 
      FROM viajes v 
      LEFT JOIN flujo_estados fe ON CASE WHEN v.via_estado ~ '^[0-9]+$' THEN CAST(v.via_estado AS INTEGER) ELSE NULL END = fe.flu_est_id
      WHERE v.via_id = ${parseInt(viaId)}
    ` as any[])[0];

    const estadoAnterior = viajeActual?.via_estado_nombre || "INICIAL";

    // 2. Obtener nuevo estado
    const estadoNuevoRow: any = (await prisma.$queryRaw`
      SELECT flu_est_nom FROM flujo_estados WHERE flu_est_id = ${parseInt(nuevoEstadoId)}
    ` as any[])[0];
    const estadoNuevo = estadoNuevoRow?.flu_est_nom || nuevoEstadoId.toString();

    // 3. ID de trazabilidad
    const maxTra: any = await prisma.$queryRaw`SELECT MAX(flu_tra_id) as max_id FROM flujo_trazabilidad`;
    const nextTraId = (maxTra[0]?.max_id || 0) + 1;

    // 4. Preparar el punto geográfico si vienen coordenadas
    let geoQuery = `NULL`;
    if (lat && lng) {
      geoQuery = `ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)`;
    }

    // 5. Transacción para actualizar e insertar trazabilidad con GEO
    await prisma.$transaction([
      prisma.$executeRaw`UPDATE viajes SET via_estado = ${nuevoEstadoId.toString()}, via_usuario_mod = ${userEmail}, via_fecha_mod = NOW() WHERE via_id = ${parseInt(viaId)}`,
      prisma.$executeRawUnsafe(`
        INSERT INTO flujo_trazabilidad (flu_tra_id, flu_tra_orig, flu_tra_ref_id, flu_tra_estado_ant, flu_tra_estado_nue, flu_tra_usuario, flu_tra_fecha, flu_tra_geo)
        VALUES ($1, 'VIAJE', $2, $3, $4, $5, NOW(), ${geoQuery})
      `, nextTraId, viaId.toString(), estadoAnterior, estadoNuevo, userEmail)
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
