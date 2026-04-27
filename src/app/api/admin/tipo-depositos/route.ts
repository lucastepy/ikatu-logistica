import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

// GET: Listar todos los tipos de depósitos
export async function GET() {
  try {
    const tipos = await prisma.tipoDeposito.findMany({
      orderBy: { tipo_dep_id: 'asc' }
    });
    return NextResponse.json(tipos);
  } catch (error) {
    console.error("Error al obtener tipos de depósitos:", error);
    return NextResponse.json({ error: "Error al obtener tipos de depósitos" }, { status: 500 });
  }
}

// POST: Crear o Actualizar tipo de depósito
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, dsc, estado, isEdit } = body;

    if (isEdit) {
      const updated = await prisma.tipoDeposito.update({
        where: { tipo_dep_id: id },
        data: {
          tipo_dep_dsc: dsc,
          tipo_dep_estado: estado,
          tipo_dep_fec_mod: new Date()
          // tipo_dep_usu_mod se deja fuera o null para evitar FK error
        }
      });
      return NextResponse.json(updated);
    } else {
      // Autoincremento manual basado en el último ID
      const last = await prisma.tipoDeposito.findFirst({
        orderBy: { tipo_dep_id: 'desc' }
      });
      const nextId = (last?.tipo_dep_id || 0) + 1;

      const created = await prisma.tipoDeposito.create({
        data: {
          tipo_dep_id: nextId,
          tipo_dep_dsc: dsc,
          tipo_dep_estado: true,
          tipo_dep_fec_alt: new Date()
          // tipo_dep_usu_alt se deja fuera o null para evitar FK error
        }
      });
      return NextResponse.json(created);
    }
  } catch (error) {
    console.error("Error al procesar tipo de depósito:", error);
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}

// DELETE: Eliminar tipo de depósito
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await prisma.tipoDeposito.delete({
      where: { tipo_dep_id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al borrar registro" }, { status: 500 });
  }
}
