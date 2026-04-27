import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const deps = await prisma.$queryRaw`SELECT dep_cod, dep_dsc FROM departamentos WHERE dep_dsc ILIKE '%CENTRAL%' OR dep_dsc ILIKE '%ASUNCION%'`;
    const zonas = await prisma.$queryRaw`SELECT zon_id, zon_nombre FROM zonas LIMIT 20`;

    return NextResponse.json({
      departamentos: deps,
      zonas: zonas
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
