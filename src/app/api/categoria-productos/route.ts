import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const categorias = await prisma.$queryRawUnsafe(`
      SELECT * FROM tenant_la_transportadora.categoria_productos 
      ORDER BY cat_prd_id ASC
    `);
    
    return NextResponse.json(categorias);
  } catch (error: any) {
    console.error("GET Categorias Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { nombre, prefijo, numerador, usuario } = await request.json();
    
    if (!nombre) return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 });

    await prisma.$queryRawUnsafe(`
      INSERT INTO tenant_la_transportadora.categoria_productos 
      (cat_prd_nombre, cat_prd_prefijo, cat_prd_numerador, cat_prd_usuario_alta)
      VALUES ($1, $2, $3, $4)
    `, nombre, (prefijo || "").toUpperCase(), parseInt(numerador) || 0, usuario || "SISTEMA");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST Categorias Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
