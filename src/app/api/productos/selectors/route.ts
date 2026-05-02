import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [marcas, categorias, unidades] = await Promise.all([
      prisma.$queryRawUnsafe(`SELECT marca_id as id, marca_nombre as nombre FROM tenant_la_transportadora.marcas ORDER BY marca_nombre`),
      prisma.$queryRawUnsafe(`SELECT cat_prd_id as id, cat_prd_nombre as nombre, cat_prd_prefijo as prefijo, cat_prd_numerador as numerador FROM tenant_la_transportadora.categoria_productos ORDER BY cat_prd_nombre`),
      prisma.$queryRawUnsafe(`SELECT uni_med_cod as id, uni_med_dsc as nombre FROM tenant_la_transportadora.unidad_medida ORDER BY uni_med_dsc`),
    ]);
    
    return NextResponse.json({ marcas, categorias, unidades });
  } catch (error: any) {
    console.error("Selectors Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
