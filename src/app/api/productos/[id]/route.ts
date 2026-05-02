import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const id = parseInt(params.id);

    await prisma.$queryRawUnsafe(`
      UPDATE tenant_la_transportadora.productos 
      SET prod_codigo = $1, prod_nombre = $2, prod_marca_id = $3, prod_categoria_id = $4, 
          prod_precio_costo = $5, prod_precio_contado = $6, prod_garantia_meses = $7, 
          prod_stock_actual = $8, prod_uni_med = $9, prod_peso_kg = $10,
          prod_usuario_mod = $11, prod_fecha_mod = NOW()
      WHERE prod_id = $12
    `, 
    body.codigo, body.nombre, 
    body.marcaId ? parseInt(body.marcaId) : null, 
    body.categoriaId ? parseInt(body.categoriaId) : null,
    body.precioCosto ? parseFloat(body.precioCosto) : 0,
    body.precioContado ? parseFloat(body.precioContado) : 0,
    body.garantia ? parseInt(body.garantia) : 0,
    body.stock ? parseInt(body.stock) : 0,
    body.unidadMedidaId ? parseInt(body.unidadMedidaId) : null,
    body.peso ? parseFloat(body.peso) : 0,
    body.usuario || "SISTEMA",
    id
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT Productos Error:", error);
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
      DELETE FROM tenant_la_transportadora.productos 
      WHERE prod_id = $1
    `, id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Productos Error:", error);
    return NextResponse.json({ 
      error: "No se puede eliminar el producto porque tiene movimientos o registros asociados." 
    }, { status: 500 });
  }
}
