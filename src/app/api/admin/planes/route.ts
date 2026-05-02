import { NextResponse } from 'next/server';
import { prismaPublic as prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const planes = await prisma.plan.findMany({
      include: {
        moneda: true,
        componentes: {
          include: {
            matriz: true
          }
        }
      },
      orderBy: { pla_id: 'asc' }
    });
    return NextResponse.json(planes);
  } catch (error) {
    console.error('Error fetching planes:', error);
    return NextResponse.json({ error: 'Error al obtener planes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Obtener siguiente ID de Plan
    const lastPlan = await prisma.plan.findFirst({ orderBy: { pla_id: 'desc' } });
    const nextPlaId = (lastPlan?.pla_id || 0) + 1;

    // 2. Crear Plan en transacción para asegurar integridad
    const result = await prisma.$transaction(async (tx) => {
      const plan = await tx.plan.create({
        data: {
          pla_id: nextPlaId,
          pla_nom: body.nombre,
          pla_desc: body.descripcion,
          pla_tipo_cobro: body.tipo_cobro,
          pla_moneda: body.moneda_id,
          pla_est: body.estado !== undefined ? body.estado : true,
          pla_usuario_alta: "SISTEMA",
        }
      });

      // Crear componentes si existen
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

          // Crear matriz si es POR_TRANSACCION
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
  } catch (error: any) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: error.message || 'Error al crear plan' }, { status: 500 });
  }
}
