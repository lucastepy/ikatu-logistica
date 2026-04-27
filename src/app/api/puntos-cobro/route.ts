import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const data: any[] = await prisma.$queryRaw`
      SELECT 
        p.pun_cob_id, p.pun_cob_nombre, p.pun_cob_tipo,
        p.pun_cob_usuario_alta, p.pun_cob_fecha_alta, p.pun_cob_usuario_mod, p.pun_cob_fecha_mod,
        t.tip_pun_cob_nombre as tipo_nombre,
        ST_X(p.pun_cob_ubicacion::geometry) as lng,
        ST_Y(p.pun_cob_ubicacion::geometry) as lat
      FROM puntos_cobro p
      JOIN tipo_puntos_cobro t ON p.pun_cob_tipo = t.tip_pun_cob_id
      ORDER BY p.pun_cob_id ASC
    `;

    // Obtener todas las tarifas y formas de pago habilitadas
    const [allTarifas, allHabilitadas] = await Promise.all([
      prisma.puntoCobroTarifa.findMany(),
      prisma.puntoCobroFormaPago.findMany()
    ]);

    // Obtener nombres de usuarios
    const emails = Array.from(new Set([
      ...data.map(i => i.pun_cob_usuario_alta),
      ...data.map(i => i.pun_cob_usuario_mod)
    ].filter(Boolean)));

    const users = await prisma.usuario.findMany({
      where: { usuario_email: { in: emails as string[] } },
      select: { usuario_email: true, usuario_nombre: true }
    });

    const userMap = Object.fromEntries(users.map(u => [u.usuario_email, u.usuario_nombre]));

    const enrichedData = data.map(item => ({
      ...item,
      tarifas: allTarifas.filter(t => t.pun_tar_pun_cob_id === item.pun_cob_id),
      formas_pago_habilitadas: allHabilitadas
        .filter(h => h.pcf_pun_cob_id === item.pun_cob_id)
        .map(h => h.pcf_forma_pago_id),
      usuario_alta_nombre: userMap[item.pun_cob_usuario_alta] || item.pun_cob_usuario_alta,
      usuario_mod_nombre: item.pun_cob_usuario_mod ? (userMap[item.pun_cob_usuario_mod] || item.pun_cob_usuario_mod) : null
    }));

    return NextResponse.json(enrichedData);
  } catch (error) {
    console.error("Error fetching puntos de cobro:", error);
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, tipo, lat, lng, usuario, tarifas, formasPagoHabilitadas } = body;

    // Calcular el siguiente ID del punto
    const maxResult: any = await prisma.$queryRaw`SELECT MAX(pun_cob_id) as max_id FROM puntos_cobro`;
    const nextId = (maxResult[0]?.max_id || 0) + 1;

    // Transacción para guardar punto, habilitadas y tarifas
    await prisma.$transaction(async (tx) => {
      // 1. Guardar el punto
      await tx.$executeRaw`
        INSERT INTO puntos_cobro (
          pun_cob_id, pun_cob_nombre, pun_cob_tipo,
          pun_cob_ubicacion, pun_cob_usuario_alta
        ) VALUES (
          ${nextId}, ${nombre}, ${parseInt(tipo)},
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          ${usuario || "ADMIN"}
        )
      `;

      // 2. Guardar formas de pago habilitadas
      if (formasPagoHabilitadas && Array.isArray(formasPagoHabilitadas)) {
        for (const fpId of formasPagoHabilitadas) {
          await tx.puntoCobroFormaPago.create({
            data: {
              pcf_pun_cob_id: nextId,
              pcf_forma_pago_id: parseInt(fpId)
            }
          });
        }
      }

      // 3. Guardar las tarifas si existen
      if (tarifas && Array.isArray(tarifas)) {
        const maxTarifa = await tx.puntoCobroTarifa.aggregate({ _max: { pun_tar_id: true } });
        let nextTarId = (maxTarifa._max.pun_tar_id || 0) + 1;

        for (const t of tarifas) {
          await tx.puntoCobroTarifa.create({
            data: {
              pun_tar_id: nextTarId++,
              pun_tar_pun_cob_id: nextId,
              pun_tar_mov_cat_id: parseInt(t.catId),
              pun_tar_forma_pago_id: parseInt(t.formaPagoId),
              pun_tar_monto: parseFloat(t.monto),
              pun_tar_usuario_alta: usuario || "ADMIN"
            }
          });
        }
      }
    });

    return NextResponse.json({ message: "Punto de cobro creado" });
  } catch (error) {
    console.error("Error creating punto de cobro:", error);
    return NextResponse.json({ error: "Error al crear registro" }, { status: 500 });
  }
}
