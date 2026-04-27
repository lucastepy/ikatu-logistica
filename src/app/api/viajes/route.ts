import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo"); 

    let viajesRaw: any[] = [];
    
    // 1. Consulta principal de Viajes
    if (tipo) {
      viajesRaw = await prisma.$queryRaw`
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
      viajesRaw = await prisma.$queryRaw`
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

    if (viajesRaw.length === 0) return NextResponse.json([]);

    const viaIds = viajesRaw.map(v => v.via_id);

    // 2. Consulta masiva de Destinos (Zonas)
    const zonasDestino: any[] = await prisma.$queryRaw`
      SELECT vz.vz_via_id, z.zon_id, z.zon_nombre, 
             ST_X(ST_Centroid(z.zon_poligono::geometry)) as lng, 
             ST_Y(ST_Centroid(z.zon_poligono::geometry)) as lat
      FROM viaje_zonas vz
      JOIN zonas z ON vz.vz_zon_id = z.zon_id
      WHERE vz.vz_via_id IN (${viaIds.length > 0 ? viaIds[0] : -1}) -- Dummy if empty, though we checked length
    `;
    // Nota: Prisma queryRaw con IN es complejo, para simplificar y asegurar velocidad 
    // lo haremos dinámico si hay muchos IDs o seguiremos una estrategia de batch.
    // Por ahora, traemos todos los destinos de una vez usando un JOIN mejorado.

    const destinosZonas: any[] = await prisma.$queryRaw`
      SELECT vz.vz_via_id, z.zon_id, z.zon_nombre, 
             ST_X(ST_Centroid(z.zon_poligono::geometry)) as lng, 
             ST_Y(ST_Centroid(z.zon_poligono::geometry)) as lat
      FROM viaje_zonas vz
      JOIN zonas z ON vz.vz_zon_id = z.zon_id
      WHERE vz.vz_via_id = ANY(${viaIds})
    `;

    const destinosClientes: any[] = await prisma.$queryRaw`
      SELECT vc.vc_via_id, cli.cli_id, cli.cli_razon_social as zon_nombre, 
             ST_X(dir.dir_geolocalizacion::geometry) as lng, 
             ST_Y(dir.dir_geolocalizacion::geometry) as lat
      FROM viaje_clientes vc
      JOIN clientes cli ON vc.vc_cli_id = cli.cli_id
      JOIN clientes_direcciones dir ON cli.cli_id = dir.cli_id
      WHERE vc.vc_via_id = ANY(${viaIds})
    `;

    // 3. Consulta masiva de Peajes
    const peajesTodos: any[] = await prisma.$queryRaw`
      SELECT vpc.*, pc.pun_cob_nombre
      FROM viaje_puntos_cobro vpc
      JOIN puntos_cobro pc ON vpc.vpc_pun_cob_id = pc.pun_cob_id
      WHERE vpc.vpc_via_id = ANY(${viaIds})
    `;

    // 4. Mapeo en memoria (O(1) lookup con objetos)
    const formatted = viajesRaw.map(v => {
      const destinos = v.via_tipo === 'ZONA' 
        ? destinosZonas.filter(d => d.vz_via_id === v.via_id)
        : destinosClientes.filter(d => d.vc_via_id === v.via_id).slice(0, 1);

      const peajes = peajesTodos.filter(p => p.vpc_via_id === v.via_id);

      return {
        ...v,
        movil: { 
          movil_chapa: v.movil_chapa,
          marca: { mov_mar_nombre: v.mov_mar_nombre },
          modelo: { mov_mod_nombre: v.mov_mod_nombre }
        },
        chofer: { per_ent_nombre: v.chofer_nombre },
        ayudante: v.ayudante_nombre ? { per_ent_nombre: v.ayudante_nombre } : null,
        deposito_origen: { 
          deposito_nombre: v.deposito_nombre || "N/A",
          deposito_geo: { lat: v.dep_lat, lng: v.dep_lng }
        },
        destinos,
        peajes
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET Viajes Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      tipo, movilId, choferDoc, ayudanteDoc, depOrigenId, 
      zonas, clientes, peajes, usuario 
    } = body;

    const res = await prisma.$transaction(async (tx: any) => {
      // Crear viaje con estado inicial 1 (Pendiente)
      const viaje: any = await tx.viaje.create({
        data: {
          via_tipo: tipo,
          via_movil_id: parseInt(movilId),
          via_chofer_doc: choferDoc,
          via_ayudante_doc: ayudanteDoc || null,
          via_deposito_origen_id: parseInt(depOrigenId),
          via_estado: "1", 
          via_usuario_alta: usuario || "SISTEMA",
          via_fecha_alta: new Date()
        }
      });

      const viaId = viaje.via_id;

      // Zonas
      if (tipo === 'ZONA' && zonas?.length > 0) {
        for (const zonId of zonas) {
          await tx.viajeZona.create({
            data: { vz_via_id: viaId, vz_zon_id: parseInt(zonId) }
          });
        }
      }

      // Clientes
      if (tipo === 'CLIENTE' && clientes?.length > 0) {
        for (const cliId of clientes) {
          await tx.viajeCliente.create({
            data: { vc_via_id: viaId, vc_cli_id: cliId }
          });
        }
      }

      // Peajes
      if (peajes?.length > 0) {
        for (const p of peajes) {
          await tx.viajePuntoCobro.create({
            data: {
              vpc_via_id: viaId,
              vpc_pun_cob_id: parseInt(p.id),
              vpc_monto: parseFloat(p.monto)
            }
          });
        }
      }

      // Registrar trazabilidad inicial
      await tx.flujoTrazabilidad.create({
        data: {
          flu_tra_id: Math.floor(Date.now() / 1000), // Ejemplo de ID manual si no es autoincrement
          flu_tra_orig: "VIAJES",
          flu_tra_ref_id: viaId.toString(),
          flu_tra_estado_ant: null,
          flu_tra_estado_nue: "1",
          flu_tra_usuario: usuario || "SISTEMA",
          flu_tra_fecha: new Date()
        }
      });

      return viaje;
    });

    return NextResponse.json(res);
  } catch (error: any) {
    console.error("POST Viajes Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const viaId = parseInt(id);

    await prisma.$transaction([
      (prisma as any).viajeZona.deleteMany({ where: { vz_via_id: viaId } }),
      (prisma as any).viajeCliente.deleteMany({ where: { vc_via_id: viaId } }),
      (prisma as any).viajePuntoCobro.deleteMany({ where: { vpc_via_id: viaId } }),
      (prisma as any).viaje.delete({ where: { via_id: viaId } })
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Viaje Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
