import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
const prisma = getPrisma("tenant_la_transportadora");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const viaId = searchParams.get("viaId");
    const usuarioEmail = searchParams.get("usuario") || "";
    
    if (!viaId) return NextResponse.json([]);

    console.error(`[DEBUG-CambiarEstado] GET: viaId=${viaId}, usuarioEmail=${usuarioEmail}`);

    // 1. Obtener perfil del usuario (en schema public)
    const usuario: any = (await prisma.$queryRaw`
      SELECT perfil_cod FROM public.usuarios WHERE LOWER(usuario_email) = LOWER(${usuarioEmail})
    ` as any[])[0];

    const perfilCod = usuario?.perfil_cod || 0;
    console.error(`[DEBUG-CambiarEstado] Perfil detectado: ${perfilCod}`);

    const viaje: any = (await prisma.$queryRaw`SELECT via_estado FROM viajes WHERE via_id = ${parseInt(viaId)}` as any[])[0];
    if (!viaje) {
      console.error(`[DEBUG-CambiarEstado] Viaje ${viaId} no encontrado`);
      return NextResponse.json([]);
    }

    const estadoActual = (viaje.via_estado || "").toString().trim().toUpperCase();
    
    // Buscar el objeto que tiene configurado el flujo
    const objeto: any = (await prisma.$queryRaw`
      SELECT DISTINCT o.obj_id, o.obj_nom 
      FROM objetos o
      JOIN flujo_estados_config fec ON o.obj_id = fec.flu_conf_obj_id
      WHERE o.obj_nom ILIKE '%viaje%'
      LIMIT 1
    ` as any[])[0];
    
    if (!objeto) {
      console.error("[DEBUG-CambiarEstado] No se encontró ningún objeto 'viaje' con flujo configurado");
      return NextResponse.json([]);
    }
    console.error(`[DEBUG-CambiarEstado] Objeto con flujo detectado: ID=${objeto.obj_id}, Nombre=${objeto.obj_nom}`);

    const totalConfig: any[] = await prisma.$queryRaw`SELECT count(*) as total FROM flujo_estados_config WHERE flu_conf_obj_id = ${objeto.obj_id}`;
    console.error(`[DEBUG-CambiarEstado] Total transiciones en DB para este objeto: ${totalConfig[0]?.total}`);

    // Volcar los perfiles que tienen ALGO configurado para este objeto
    const perfilesConfig: any[] = await prisma.$queryRaw`SELECT DISTINCT flu_conf_perfil_cod FROM flujo_estados_config WHERE flu_conf_obj_id = ${objeto.obj_id}`;
    
    // Obtener nombres de perfiles involucrados
    const idsParaNombre = Array.from(new Set([perfilCod, ...perfilesConfig.map(p => p.flu_conf_perfil_cod)]));
    const nombresPerfiles: any[] = await prisma.$queryRaw`SELECT perfil_cod, perfil_nombre FROM public.perfiles WHERE perfil_cod = ANY(${idsParaNombre})`;
    const nombreMap = Object.fromEntries(nombresPerfiles.map(p => [p.perfil_cod, p.perfil_nombre]));

    console.error(`[DEBUG-CambiarEstado] Buscando todas las transiciones posibles para Objeto=${objeto.obj_id}, Estado='${estadoActual}'`);

    let transiciones: any[] = await prisma.$queryRaw`
      SELECT 
        fec.flu_conf_id as id,
        fec.flu_conf_etiqueta_accion as accion,
        fe.flu_est_id as "estadoSiguienteId",
        fe.flu_est_nom as "estadoSiguienteNom",
        fec.flu_conf_perfil_cod as "perfilAutorizadoId",
        p.perfil_nombre as "perfilAutorizadoNom",
        CASE WHEN fec.flu_conf_perfil_cod = ${perfilCod} THEN true ELSE false END as "canExecute"
      FROM flujo_estados_config fec
      JOIN flujo_estados fe ON fec.flu_conf_id_estado_siguiente = fe.flu_est_id
      LEFT JOIN flujo_estados fe_act ON fec.flu_conf_id_estado_actual = fe_act.flu_est_id
      LEFT JOIN public.perfiles p ON fec.flu_conf_perfil_cod = p.perfil_cod
      WHERE fec.flu_conf_obj_id = ${objeto.obj_id}
        AND (
          CAST(fec.flu_conf_id_estado_actual AS TEXT) = ${estadoActual}
          OR UPPER(TRIM(fe_act.flu_est_nom)) = ${estadoActual}
        )
      ORDER BY "canExecute" DESC, accion ASC
    `;

    // Agrupar por acción para no repetir botones si varios perfiles pueden hacer lo mismo, 
    // pero priorizando el que el usuario SÍ puede ejecutar.
    const uniqueActions = transiciones.reduce((acc: any[], curr) => {
      const existing = acc.find(a => a.accion === curr.accion && a.estadoSiguienteId === curr.estadoSiguienteId);
      if (!existing) {
        acc.push(curr);
      } else if (curr.canExecute) {
        existing.canExecute = true;
      }
      return acc;
    }, []);
    
    // Serialización segura para BigInt
    const serialize = (obj: any) => {
      return JSON.parse(JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
    };

    return NextResponse.json(serialize(uniqueActions));
  } catch (error: any) {
    console.error("[CambiarEstado] CRITICAL ERROR:", error);
    return NextResponse.json({ 
      error: error.message, 
      stack: error.stack,
      hint: "Check server logs for details"
    }, { status: 500 });
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
      geoQuery = `public.ST_SetSRID(public.ST_Point(${lng}, ${lat}), 4326)`;
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
