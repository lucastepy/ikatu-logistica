import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prisma = getPrisma("tenant_la_transportadora");
    const columns = await prisma.$queryRawUnsafe<any[]>(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'viajes'
    `);
    return NextResponse.json(columns);
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
