import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Obtenemos las marcas del esquema del inquilino (tenant)
    // Usamos queryRawUnsafe porque la tabla 'marcas' es nueva y podría no estar en el esquema de Prisma todavía
    const marcas = await prisma.$queryRawUnsafe(`
      SELECT * FROM tenant_la_transportadora.marcas 
      ORDER BY marca_id ASC
    `);
    
    return NextResponse.json(marcas);
  } catch (error: any) {
    console.error("GET Marcas Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { nombre, usuario } = await request.json();
    
    if (!nombre) return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 });

    await prisma.$queryRawUnsafe(`
      INSERT INTO tenant_la_transportadora.marcas (marca_nombre, marca_usuario_alta)
      VALUES ($1, $2)
    `, nombre, usuario || "SISTEMA");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST Marcas Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
