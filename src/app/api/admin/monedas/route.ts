import { NextResponse } from 'next/server';
import { prismaPublic as prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const monedas = await prisma.moneda.findMany({
      orderBy: { moneda_cod: 'asc' }
    });
    return NextResponse.json(monedas);
  } catch (error) {
    console.error('Error fetching monedas:', error);
    return NextResponse.json({ error: 'Error al obtener monedas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Obtener el siguiente código si no se proporciona o autoincrementar
    let nextCod = body.moneda_cod;
    if (!nextCod) {
      const lastMoneda = await prisma.moneda.findFirst({
        orderBy: { moneda_cod: 'desc' }
      });
      nextCod = (lastMoneda?.moneda_cod || 0) + 1;
    }

    const nuevaMoneda = await prisma.moneda.create({
      data: {
        moneda_cod: nextCod,
        moneda_nom: body.moneda_nom,
        moneda_sim: body.moneda_sim?.toUpperCase(),
        moneda_usuario_alta: "SISTEMA",
      }
    });

    return NextResponse.json(nuevaMoneda);
  } catch (error) {
    console.error('Error creating moneda:', error);
    return NextResponse.json({ error: 'Error al crear moneda' }, { status: 500 });
  }
}
