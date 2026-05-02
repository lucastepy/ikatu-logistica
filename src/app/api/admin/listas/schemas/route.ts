import { NextResponse } from "next/server";
import { prismaPublic as prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Consulta directa para obtener esquemas de PostgreSQL
    const schemas: any[] = await prisma.$queryRaw`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name ASC
    `;
    
    return NextResponse.json(schemas.map(s => s.schema_name));
  } catch (error) {
    console.error("Error fetching schemas:", error);
    return NextResponse.json({ error: "Error al obtener esquemas" }, { status: 500 });
  }
}
