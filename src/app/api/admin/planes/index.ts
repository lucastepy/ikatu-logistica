import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizar datos básicos del Plan
      const plan = await tx.plan.update({
        where: { pla_id: id },
        data: {
          pla_nom: body.nombre,
          pla_desc: body.descripcion,
          pla_tipo_cobro: body.tipo_cobro,
          pla_est: body.estado,
          pla_usuario_mod: "SISTEMA",
          pla_fecha_mod: new Date(),
        }
      });

      // 2. Eliminar componentes y matrices antiguas para simplificar la actualización
      // (Cascade delete configurado en Prisma se encargará de las matrices)
      await tx.planComponente.deleteMany({
        where: { comp_pla_id: id }
      });

      // 3. Re-crear componentes y sus matrices
      if (body.componentes && body.componentes.length > 0) {
        let lastComp = await tx.planComponente.findFirst({ orderBy: { comp_id: 'desc' } });
        let nextCompId = (lastComp?.comp_id || 0) + 1;

        for (const comp of body.componentes) {
          const nuevoComp = await tx.planComponente.create({
            data: {
              comp_id: nextCompId++,
              comp_pla_id: plan.pla_id,
              comp_nom: comp.nombre,
              comp_tipo: comp.tipo,
              comp_monto: comp.monto || 0,
              comp_recurrencia: comp.recurrencia,
              comp_est: true,
              comp_usuario_alta: "SISTEMA",
            }
          });

          if (comp.tipo === 'POR_TRANSACCION' && comp.matriz && comp.matriz.length > 0) {
            let lastMat = await tx.planMatrizEscalonada.findFirst({ orderBy: { mat_id: 'desc' } });
            let nextMatId = (lastMat?.mat_id || 0) + 1;

            for (const mat of comp.matriz) {
              await tx.planMatrizEscalonada.create({
                data: {
                  mat_id: nextMatId++,
                  mat_comp_id: nuevoComp.comp_id,
                  mat_desde: mat.desde,
                  mat_hasta: mat.hasta,
                  mat_valor: mat.valor,
                  mat_es_porcentaje: mat.es_porcentaje || false,
                  mat_usuario_alta: "SISTEMA",
                }
              });
            }
          }
        }
      }

      return plan;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Error al actualizar plan' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await prisma.plan.delete({
      where: { pla_id: id }
    });
    return NextResponse.json({ message: 'Plan eliminado' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Error al eliminar plan' }, { status: 500 });
  }
}
