import { NextResponse } from "next/server";
import { prismaPublic as prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tables = await prisma.$queryRawUnsafe<any[]>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    return NextResponse.json(tables);
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
