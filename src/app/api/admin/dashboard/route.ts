import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET() {
  try {
    const [menusCount, detailsCount, perfilesCount] = await Promise.all([
      prisma.menu.count(),
      prisma.menuDet.count(),
      prisma.perfil.count()
    ]);

    return NextResponse.json({
      metrics: {
        menus: menusCount,
        items: detailsCount,
        profiles: perfilesCount,
        lastSync: new RegExp(/T/).test(new Date().toISOString()) 
          ? new Date().toLocaleTimeString() 
          : "Recién"
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al cargar dashboard" }, { status: 500 });
  }
}
