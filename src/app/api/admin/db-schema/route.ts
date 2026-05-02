import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("table");
    const tenant = searchParams.get("tenant") || "public";

    if (tableName) {
      // Obtener columnas con sus descripciones
      const columns: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          cols.column_name as name,
          pg_catalog.col_description(c.oid, cols.ordinal_position::int) as description
        FROM 
          information_schema.columns cols
        JOIN 
          pg_catalog.pg_class c ON c.relname = cols.table_name
        JOIN 
          pg_catalog.pg_namespace n ON n.oid = c.relnamespace AND n.nspname = cols.table_schema
        WHERE 
          cols.table_schema = $1
          AND cols.table_name = $2
        ORDER BY 
          cols.ordinal_position;
      `, tenant, tableName);
      return NextResponse.json(columns);
    } else {
      // Obtener todas las tablas con sus descripciones
      const tables: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          relname as name,
          obj_description(c.oid) as description
        FROM 
          pg_catalog.pg_class c
        JOIN 
          pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE 
          n.nspname = $1
          AND relkind = 'r'
        ORDER BY 
          relname;
      `, tenant);
      return NextResponse.json(tables);
    }
  } catch (error) {
    console.error("DB Schema Error:", error);
    return NextResponse.json({ error: "Error al obtener esquema de BD" }, { status: 500 });
  }
}
