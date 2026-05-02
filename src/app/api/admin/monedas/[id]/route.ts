import { NextResponse } from 'next/server';
import { prismaPublic as prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();

    const moneda = await prisma.moneda.update({
      where: { moneda_cod: id },
      data: {
        moneda_nom: body.moneda_nom,
        moneda_sim: body.moneda_sim?.toUpperCase(),
        moneda_usuario_mod: "SISTEMA",
        moneda_fecha_mod: new Date(),
      }
    });

    return NextResponse.json(moneda);
  } catch (error) {
    console.error('Error updating moneda:', error);
    return NextResponse.json({ error: 'Error al actualizar moneda' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await prisma.moneda.delete({
      where: { moneda_cod: id }
    });
    return NextResponse.json({ message: 'Moneda eliminada' });
  } catch (error) {
    console.error('Error deleting moneda:', error);
    return NextResponse.json({ error: 'Error al eliminar moneda' }, { status: 500 });
  }
}
