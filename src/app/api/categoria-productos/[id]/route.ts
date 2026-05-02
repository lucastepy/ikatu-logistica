import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { nombre, prefijo, numerador, usuario } = await request.json();
    const id = parseInt(params.id);

    await prisma.$queryRawUnsafe(`
      UPDATE tenant_la_transportadora.categoria_productos 
      SET cat_prd_nombre = $1, cat_prd_prefijo = $2, cat_prd_numerador = $3, 
          cat_prd_usuario_mod = $4, cat_prd_fecha_mod = NOW()
      WHERE cat_prd_id = $5
    `, nombre, (prefijo || "").toUpperCase(), parseInt(numerador) || 0, usuario || "SISTEMA", id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT Categorias Error:", error);
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
      DELETE FROM tenant_la_transportadora.categoria_productos 
      WHERE cat_prd_id = $1
    `, id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Categorias Error:", error);
    return NextResponse.json({ 
      error: "No se puede eliminar la categoría porque está siendo utilizada." 
    }, { status: 500 });
  }
}
