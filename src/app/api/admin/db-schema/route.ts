import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("table");

    if (tableName) {
      // Obtener columnas de una tabla específica
      const columns: any[] = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
        ORDER BY ordinal_position;
      `;
      return NextResponse.json(columns.map(c => c.column_name));
    } else {
      // Obtener todas las tablas del esquema público
      const tables: any[] = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `;
      return NextResponse.json(tables.map(t => t.table_name));
    }
  } catch (error) {
    console.error("DB Schema Error:", error);
    return NextResponse.json({ error: "Error al obtener esquema de BD" }, { status: 500 });
  }
}
