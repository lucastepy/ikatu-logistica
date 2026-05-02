import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Estas tablas son globales y residen en el esquema PUBLIC
    const [menusRes, detailsRes, perfilesRes] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as count FROM public.menu`),
      prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as count FROM public.menu_det`),
      prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as count FROM public.perfiles`),
    ]);

    return NextResponse.json({
      metrics: {
        menus: menusRes[0]?.count || 0,
        items: detailsRes[0]?.count || 0,
        profiles: perfilesRes[0]?.count || 0,
        lastSync: new Date().toLocaleTimeString('es-PY')
      }
    });
  } catch (error: any) {
    console.error("Dashboard SQL Error:", error);
    return NextResponse.json({ 
      error: "Error al cargar dashboard administrativo",
      details: error.message 
    }, { status: 500 });
  }
}
