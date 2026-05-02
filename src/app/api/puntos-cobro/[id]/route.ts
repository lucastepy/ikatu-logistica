import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
const prisma = getPrisma("tenant_la_transportadora");

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, tipo, lat, lng, usuario, tarifas, formasPagoHabilitadas } = body;
    const punId = parseInt(id);

    await prisma.$transaction(async (tx) => {
      // 1. Actualizar el punto
      await tx.$executeRaw`
        UPDATE puntos_cobro SET
          pun_cob_nombre = ${nombre},
          pun_cob_tipo = ${parseInt(tipo)},
          pun_cob_ubicacion = public.ST_SetSRID(public.ST_MakePoint(CAST(${lng} AS float8), CAST(${lat} AS float8)), 4326),
          pun_cob_usuario_mod = ${usuario || "ADMIN"},
          pun_cob_fecha_mod = now()
        WHERE pun_cob_id = ${punId}
      `;

      // 2. Limpiar y Re-insertar formas de pago habilitadas
      await tx.puntoCobroFormaPago.deleteMany({
        where: { pcf_pun_cob_id: punId }
      });

      if (formasPagoHabilitadas && Array.isArray(formasPagoHabilitadas)) {
        for (const fpId of formasPagoHabilitadas) {
          await tx.puntoCobroFormaPago.create({
            data: {
              pcf_pun_cob_id: punId,
              pcf_forma_pago_id: parseInt(fpId)
            }
          });
        }
      }

      // 3. Limpiar tarifas anteriores
      await tx.puntoCobroTarifa.deleteMany({
        where: { pun_tar_pun_cob_id: punId }
      });

      // 4. Insertar nuevas tarifas
      if (tarifas && Array.isArray(tarifas)) {
        const maxTarifa = await tx.puntoCobroTarifa.aggregate({ _max: { pun_tar_id: true } });
        let nextTarId = (maxTarifa._max.pun_tar_id || 0) + 1;

        for (const t of tarifas) {
          await tx.puntoCobroTarifa.create({
            data: {
              pun_tar_id: nextTarId++,
              pun_tar_pun_cob_id: punId,
              pun_tar_mov_cat_id: parseInt(t.catId),
              pun_tar_forma_pago_id: parseInt(t.formaPagoId),
              pun_tar_monto: parseFloat(t.monto),
              pun_tar_usuario_alta: usuario || "ADMIN",
              pun_tar_usuario_mod: usuario || "ADMIN",
              pun_tar_fecha_mod: new Date()
            }
          });
        }
      }
    });

    return NextResponse.json({ message: "Punto de cobro actualizado" });
  } catch (error) {
    console.error("Error updating punto de cobro:", error);
    return NextResponse.json({ error: "Error al actualizar registro" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.$executeRaw`DELETE FROM puntos_cobro WHERE pun_cob_id = ${parseInt(id)}`;
    return NextResponse.json({ message: "Punto de cobro eliminado" });
  } catch (error) {
    console.error("Error deleting punto de cobro:", error);
    return NextResponse.json({ error: "Error al eliminar registro" }, { status: 500 });
  }
}
