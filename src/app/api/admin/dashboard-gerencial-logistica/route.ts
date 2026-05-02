import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tenantSchema = "tenant_la_transportadora";
    const prisma = getPrisma(tenantSchema);

    // 1. Datos Maestros del Tenant
    const [depositosRes, movilesRes, personalRes] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as count FROM depositos`).catch(() => [{count: 0}]),
      prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as count FROM moviles`).catch(() => [{count: 0}]),
      prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as count FROM personal_entrega`).catch(() => [{count: 0}]),
    ]);

    // 2. Métricas de Viajes Operativos
    const viajesStats = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN via_estado IN ('2', 'EN RUTA', '20', 'EN CAMINO') THEN 1 END)::int as en_ruta,
        COUNT(CASE WHEN via_estado IN ('3', 'FINALIZADO', '30', 'ENTREGADO') THEN 1 END)::int as finalizados,
        COUNT(CASE WHEN via_estado IN ('1', 'PENDIENTE', '10', 'PROGRAMADO') THEN 1 END)::int as pendientes
      FROM viajes
    `).catch(() => ([{ total: 0, en_ruta: 0, finalizados: 0, pendientes: 0 }]));

    // 3. Capacidad de Almacenamiento
    const capacidadRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        SUM(COALESCE(deposito_cap_vol_m3, 0))::float as total_m3
      FROM depositos
    `).catch(() => ([{ total_m3: 0 }]));

    // 4. Últimos Movimientos (Corregido: Quitamos via_nombre)
    const recientes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        v.via_id, 
        v.via_tipo, 
        v.via_estado,
        v.via_fecha_alta,
        m.movil_chapa,
        p.per_ent_nombre as chofer
      FROM viajes v
      LEFT JOIN moviles m ON v.via_movil_id = m.movil_id
      LEFT JOIN personal_entrega p ON v.via_chofer_doc = p.per_ent_documento
      ORDER BY v.via_fecha_alta DESC
      LIMIT 5
    `).catch(() => []);

    return NextResponse.json({
      metrics: {
        depositos: depositosRes[0]?.count || 0,
        moviles: movilesRes[0]?.count || 0,
        personal: personalRes[0]?.count || 0,
        viajes: {
          total: viajesStats[0]?.total || 0,
          enRuta: viajesStats[0]?.en_ruta || 0,
          finalizados: viajesStats[0]?.finalizados || 0,
          pendientes: viajesStats[0]?.pendientes || 0,
        },
        capacidad: {
          totalM3: capacidadRes[0]?.total_m3 || 0,
          ocupacion: 85 // Mock de ocupación
        },
        lastUpdate: new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })
      },
      recientes: recientes.map(r => ({
        id: r.via_id,
        nombre: `${r.via_tipo} #${r.via_id}`, // Generamos el nombre dinámicamente
        estado: r.via_estado || 'N/A',
        movil: r.movil_chapa || 'S/N',
        chofer: r.chofer || 'No asignado',
        fecha: r.via_fecha_alta
      }))
    });
  } catch (error: any) {
    console.error("Gerencial Dashboard Error:", error);
    return NextResponse.json({ 
      error: "Error al obtener métricas",
      details: error.message,
      recientes: []
    }, { status: 500 });
  }
}
