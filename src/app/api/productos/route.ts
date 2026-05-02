import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const productos = await prisma.$queryRawUnsafe(`
      SELECT p.*, m.marca_nombre, c.cat_prd_nombre, u.uni_med_dsc
      FROM tenant_la_transportadora.productos p
      LEFT JOIN tenant_la_transportadora.marcas m ON p.prod_marca_id = m.marca_id
      LEFT JOIN tenant_la_transportadora.categoria_productos c ON p.prod_categoria_id = c.cat_prd_id
      LEFT JOIN tenant_la_transportadora.unidad_medida u ON p.prod_uni_med = u.uni_med_cod
      ORDER BY p.prod_id ASC
    `);
    
    return NextResponse.json(productos);
  } catch (error: any) {
    console.error("GET Productos Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Obtener ID correlativo del producto
    const max: any = await prisma.$queryRawUnsafe(`SELECT COALESCE(MAX(prod_id), 0) + 1 as next_id FROM tenant_la_transportadora.productos`);
    const prodId = max[0].next_id;

    // 2. Insertar el producto
    await prisma.$queryRawUnsafe(`
      INSERT INTO tenant_la_transportadora.productos 
      (prod_id, prod_codigo, prod_nombre, prod_marca_id, prod_categoria_id, prod_precio_costo, 
       prod_precio_contado, prod_garantia_meses, prod_stock_actual, prod_uni_med, prod_peso_kg, prod_usuario_alta)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, 
    prodId, body.codigo, body.nombre, 
    body.marcaId ? parseInt(body.marcaId) : null, 
    body.categoriaId ? parseInt(body.categoriaId) : null,
    body.precioCosto ? parseFloat(body.precioCosto) : 0,
    body.precioContado ? parseFloat(body.precioContado) : 0,
    body.garantia ? parseInt(body.garantia) : 0,
    body.stock ? parseInt(body.stock) : 0,
    body.unidadMedidaId ? parseInt(body.unidadMedidaId) : null,
    body.peso ? parseFloat(body.peso) : 0,
    body.usuario || "SISTEMA"
    );

    // 3. Incrementar el numerador en la categoría de productos
    if (body.categoriaId) {
      await prisma.$queryRawUnsafe(`
        UPDATE tenant_la_transportadora.categoria_productos 
        SET cat_prd_numerador = COALESCE(cat_prd_numerador, 0) + 1
        WHERE cat_prd_id = $1
      `, parseInt(body.categoriaId));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST Productos Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
