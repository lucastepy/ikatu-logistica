import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
const prisma = getPrisma("tenant_la_transportadora");

export async function GET() {
  try {
    const extensions = await prisma.$queryRaw`SELECT extname, extversion FROM pg_extension`;
    const postgisSchema = await prisma.$queryRaw`SELECT n.nspname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'st_makepoint' LIMIT 1`;

    return NextResponse.json({
      extensions,
      postgisSchema: postgisSchema
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
