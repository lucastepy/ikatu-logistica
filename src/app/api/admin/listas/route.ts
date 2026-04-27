import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [empresas, sucursales, perfiles] = await Promise.all([
      prisma.empresa.findMany({ select: { empresa_cod: true, empresa_nom: true } }),
      prisma.sucursal.findMany({ select: { suc_id: true, suc_nombre: true } }),
      prisma.perfil.findMany({ select: { perfil_cod: true, perfil_nombre: true } })
    ]);

    return NextResponse.json({
      empresas,
      sucursales,
      perfiles
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al cargar listas" }, { status: 500 });
  }
}
