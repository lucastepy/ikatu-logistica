import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { nombre, usuario } = await request.json();
    const id = parseInt(params.id);

    await prisma.$queryRawUnsafe(`
      UPDATE tenant_la_transportadora.marcas 
      SET marca_nombre = $1, marca_usuario_mod = $2, marca_fecha_mod = NOW()
      WHERE marca_id = $3
    `, nombre, usuario || "SISTEMA", id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT Marcas Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    await prisma.$queryRawUnsafe(`
      DELETE FROM tenant_la_transportadora.marcas 
      WHERE marca_id = $1
    `, id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Marcas Error:", error);
    // Manejar error de integridad referencial si es necesario
    return NextResponse.json({ 
      error: "No se puede eliminar la marca porque está en uso por otros registros." 
    }, { status: 500 });
  }
}
