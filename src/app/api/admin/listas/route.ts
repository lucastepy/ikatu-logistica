import { NextResponse } from "next/server";
import { prismaPublic as prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [perfiles, clientes] = await Promise.all([
      prisma.perfil.findMany({ select: { perfil_cod: true, perfil_nombre: true } }),
      prisma.clienteSaas.findMany({ select: { cli_saas_cod: true, cli_saas_nom: true, cli_saas_tenant: true } })
    ]);

    return NextResponse.json({
      perfiles,
      clientes
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al cargar listas" }, { status: 500 });
  }
}
