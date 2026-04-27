import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo"); 

    let data: any[] = [];
    
    if (tipo) {
      data = await prisma.$queryRaw`
        SELECT 
          v.*,
          m.movil_chapa,
          mar.mov_mar_nombre,
          mod.mov_mod_nombre,
          c.per_ent_nombre as chofer_nombre,
          a.per_ent_nombre as ayudante_nombre,
          COALESCE(fe.flu_est_nom, v.via_estado) as via_estado_nombre,
          ST_X(d.deposito_geo::geometry) as dep_lng,
          ST_Y(d.deposito_geo::geometry) as dep_lat
        FROM viajes v
        LEFT JOIN moviles m ON v.via_movil_id = m.movil_id
        LEFT JOIN movil_marcas mar ON m.movil_marca_id = mar.mov_mar_id
        LEFT JOIN movil_modelos mod ON m.movil_modelo_id = mod.mov_mod_id
        LEFT JOIN personal_entrega c ON v.via_chofer_doc = c.per_ent_documento
        LEFT JOIN personal_entrega a ON v.via_ayudante_doc = a.per_ent_documento
        LEFT JOIN depositos d ON v.via_deposito_origen_id = d.deposito_id
        LEFT JOIN flujo_estados fe ON (
          CASE WHEN v.via_estado ~ '^[0-9]+$' THEN CAST(v.via_estado AS INTEGER) ELSE NULL END
        ) = fe.flu_est_id
        WHERE v.via_tipo = ${tipo}
        ORDER BY v.via_fecha_alta DESC
      `;
    } else {
      data = await prisma.$queryRaw`
        SELECT 
          v.*,
          m.movil_chapa,
          mar.mov_mar_nombre,
          mod.mov_mod_nombre,
          c.per_ent_nombre as chofer_nombre,
          a.per_ent_nombre as ayudante_nombre,
          d.deposito_nombre,
          COALESCE(fe.flu_est_nom, v.via_estado) as via_estado_nombre,
          ST_X(d.deposito_geo::geometry) as dep_lng,
          ST_Y(d.deposito_geo::geometry) as dep_lat
        FROM viajes v
        LEFT JOIN moviles m ON v.via_movil_id = m.movil_id
        LEFT JOIN movil_marcas mar ON m.movil_marca_id = mar.mov_mar_id
        LEFT JOIN movil_modelos mod ON m.movil_modelo_id = mod.mov_mod_id
        LEFT JOIN personal_entrega c ON v.via_chofer_doc = c.per_ent_documento
        LEFT JOIN personal_entrega a ON v.via_ayudante_doc = a.per_ent_documento
        LEFT JOIN depositos d ON v.via_deposito_origen_id = d.deposito_id
        LEFT JOIN flujo_estados fe ON (
          CASE WHEN v.via_estado ~ '^[0-9]+$' THEN CAST(v.via_estado AS INTEGER) ELSE NULL END
        ) = fe.flu_est_id
        ORDER BY v.via_fecha_alta DESC
      `;
    }

    const formatted = await Promise.all(data.map(async (v) => {
      let destinos: any[] = [];
      if (v.via_tipo === 'ZONA') {
        destinos = await prisma.$queryRaw`
          SELECT z.zon_id, z.zon_nombre, ST_X(ST_Centroid(z.zon_poligono::geometry)) as lng, ST_Y(ST_Centroid(z.zon_poligono::geometry)) as lat
          FROM viaje_zonas vz
          JOIN zonas z ON vz.vz_zon_id = z.zon_id
          WHERE vz.vz_via_id = ${v.via_id}
        `;
      } else {
        // Corregido: Obtener coordenadas desde clientes_direcciones
        destinos = await prisma.$queryRaw`
          SELECT cli.cli_id, cli.cli_razon_social as zon_nombre, ST_X(dir.dir_geolocalizacion::geometry) as lng, ST_Y(dir.dir_geolocalizacion::geometry) as lat
          FROM viaje_clientes vc
          JOIN clientes cli ON vc.vc_cli_id = cli.cli_id
          JOIN clientes_direcciones dir ON cli.cli_id = dir.cli_id
          WHERE vc.vc_via_id = ${v.via_id}
          LIMIT 1 -- Tomamos la dirección principal si hay varias
        `;
      }

      // También cargamos los peajes asociados para el modo edición
      const peajes = await prisma.$queryRaw`
        SELECT vpc.*, pc.pun_cob_nombre
        FROM viaje_puntos_cobro vpc
        JOIN puntos_cobro pc ON vpc.vpc_pun_cob_id = pc.pun_cob_id
        WHERE vpc.vpc_via_id = ${v.via_id}
      `;

      return {
        ...v,
        movil: { 
          movil_chapa: v.movil_chapa,
          marca: { mov_mar_nombre: v.mov_mar_nombre },
          modelo: { mov_mod_nombre: v.mov_mod_nombre }
        },
        chofer: { per_ent_nombre: v.chofer_nombre },
        ayudante: v.ayudante_nombre ? { per_ent_nombre: v.ayudante_nombre } : null,
        deposito: { 
          deposito_nombre: v.deposito_nombre,
          lat: v.dep_lat,
          lng: v.dep_lng
        },
        zonas: destinos,
        puntos_cobro: peajes
      };
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Error al obtener viajes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      movilId, choferDoc, ayudanteDoc, formaPagoId, depositoId, 
      tipo, fechaProgramada, selectedZonas, selectedClientes, usuario, puntosCobro
    } = body;

    const maxResult: any = await prisma.$queryRaw`SELECT MAX(via_id) as max_id FROM viajes`;
    const nextId = (maxResult[0]?.max_id || 0) + 1;

    // Obtener el ID del estado destino de la regla inicial para el objeto VIAJES
    const initialConfig: any[] = await prisma.$queryRaw`
      SELECT flu_conf_id_estado_siguiente 
      FROM flujo_estados_config 
      WHERE flu_conf_obj_id = (SELECT obj_id FROM objetos WHERE obj_nom ILIKE '%VIAJE%' LIMIT 1)
        AND flu_conf_es_estado_inicial = true
      LIMIT 1
    `;
    // El viaje nace en el estado destino de la regla inicial (ej: PROGRAMADO)
    const initialStatusId = initialConfig[0]?.flu_conf_id_estado_siguiente?.toString() || "2";

    // Preparar datos para trazabilidad
    const maxTra: any = await prisma.$queryRaw`SELECT MAX(flu_tra_id) as max_id FROM flujo_trazabilidad`;
    const nextTraId = (maxTra[0]?.max_id || 0) + 1;
    
    const estadoNombre: any = await prisma.$queryRaw`SELECT flu_est_nom FROM flujo_estados WHERE flu_est_id = ${parseInt(initialStatusId)}`;
    const nombreFinal = estadoNombre[0]?.flu_est_nom || "PROGRAMADO";

    const viaje = await prisma.$transaction(async (tx: any) => {
      const newViaje = await tx.viaje.create({
        data: {
          via_id: nextId,
          via_movil_id: parseInt(movilId),
          via_chofer_doc: choferDoc,
          via_ayudante_doc: ayudanteDoc || null,
          via_forma_pago_gastos_id: parseInt(formaPagoId),
          via_deposito_origen_id: parseInt(depositoId),
          via_tipo: tipo,
          via_fecha_programada: new Date(fechaProgramada),
          via_usuario_alta: usuario,
          via_estado: initialStatusId
        }
      });

      // Insertar trazabilidad inicial vía Raw SQL para asegurar coincidencia de tipos con flu_tra_ref_id
      await tx.$executeRaw`
        INSERT INTO flujo_trazabilidad (flu_tra_id, flu_tra_orig, flu_tra_ref_id, flu_tra_estado_ant, flu_tra_estado_nue, flu_tra_usuario, flu_tra_fecha)
        VALUES (${nextTraId}, 'VIAJE', ${nextId.toString()}, 'INICIAL', ${nombreFinal}, ${usuario}, NOW())
      `;

      if (tipo === "ZONA" && selectedZonas && selectedZonas.length > 0) {
        await tx.viajeZona.createMany({
          data: selectedZonas.map((zId: number) => ({
            vz_via_id: nextId,
            vz_zon_id: zId
          }))
        });
      } else if (tipo === "RUTA" && selectedClientes && selectedClientes.length > 0) {
        await tx.viajeCliente.createMany({
          data: selectedClientes.map((cId: string, index: number) => ({
            vc_via_id: nextId,
            vc_cli_id: cId,
            vc_orden: index + 1
          }))
        });
      }

      if (puntosCobro && puntosCobro.length > 0) {
        await tx.viajePuntoCobro.createMany({
          data: puntosCobro.map((pc: any) => ({
            vpc_via_id: nextId,
            vpc_pun_cob_id: pc.id,
            vpc_monto: pc.monto,
            vpc_estado: "PENDIENTE"
          }))
        });
      }

      await tx.viajeTrazabilidad.create({
        data: {
          via_tra_id: nextTraId,
          via_tra_via_id: nextId,
          via_tra_estado_ant: 'INICIAL',
          via_tra_estado_nue: nombreFinal,
          via_tra_usuario: usuario,
          via_tra_fecha: new Date()
        }
      });

      return newViaje;
    });

    return NextResponse.json(viaje);
  } catch (error: any) {
    console.error("Error al crear viaje:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      via_id, movilId, choferDoc, ayudanteDoc, formaPagoId, depositoId, 
      tipo, fechaProgramada, selectedZonas, selectedClientes, usuario, puntosCobro
    } = body;

    if (!via_id) return NextResponse.json({ error: "ID de viaje requerido" }, { status: 400 });

    const viaje = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.viaje.update({
        where: { via_id },
        data: {
          via_movil_id: parseInt(movilId),
          via_chofer_doc: choferDoc,
          via_ayudante_doc: ayudanteDoc || null,
          via_forma_pago_gastos_id: parseInt(formaPagoId),
          via_deposito_origen_id: parseInt(depositoId),
          via_tipo: tipo,
          via_fecha_programada: new Date(fechaProgramada),
          via_usuario_mod: usuario,
          via_fecha_mod: new Date()
        }
      });

      await tx.viajeZona.deleteMany({ where: { vz_via_id: via_id } });
      await tx.viajeCliente.deleteMany({ where: { vc_via_id: via_id } });
      await tx.viajePuntoCobro.deleteMany({ where: { vpc_via_id: via_id } });

      if (tipo === "ZONA" && selectedZonas && selectedZonas.length > 0) {
        await tx.viajeZona.createMany({
          data: selectedZonas.map((zId: number) => ({
            vz_via_id: via_id,
            vz_zon_id: zId
          }))
        });
      } else if (tipo === "RUTA" && selectedClientes && selectedClientes.length > 0) {
        await tx.viajeCliente.createMany({
          data: selectedClientes.map((cId: string, index: number) => ({
            vc_via_id: via_id,
            vc_cli_id: cId,
            vc_orden: index + 1
          }))
        });
      }

      if (puntosCobro && puntosCobro.length > 0) {
        await tx.viajePuntoCobro.createMany({
          data: puntosCobro.map((pc: any) => ({
            vpc_via_id: via_id,
            vpc_pun_cob_id: pc.id,
            vpc_monto: pc.monto,
            vpc_estado: "PENDIENTE"
          }))
        });
      }

      return updated;
    });

    return NextResponse.json(viaje);
  } catch (error: any) {
    console.error("Error al actualizar viaje:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID de viaje requerido" }, { status: 400 });

    const viaId = parseInt(id);

    await (prisma as any).$transaction([
      (prisma as any).viajeZona.deleteMany({ where: { vz_via_id: viaId } }),
      (prisma as any).viajeCliente.deleteMany({ where: { vc_via_id: viaId } }),
      (prisma as any).viajePuntoCobro.deleteMany({ where: { vpc_via_id: viaId } }),
      (prisma as any).viaje.delete({ where: { via_id: viaId } })
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al eliminar viaje:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
