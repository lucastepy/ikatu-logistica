import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function GET(request: Request) {
  try {
    // En Next.js 15, headers() es asíncrono y debe ser esperado
    const headerList = await headers();
    const tenantId = headerList.get("x-tenant-id") || "public";

    const query = `SELECT * FROM "${tenantId}"."empresa" LIMIT 1`;
    const empresas: any[] = await (prisma as any).$queryRawUnsafe(query);
    const empresa = empresas[0];

    if (!empresa) {
      return NextResponse.json({ error: "Datos de empresa no configurados" }, { status: 404 });
    }

    return NextResponse.json(empresa);
  } catch (error: any) {
    console.error("GET Empresa SQL Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      empresa_cod,
      empresa_nom, 
      empresa_nom_fan, 
      empresa_ruc, 
      empresa_mail, 
      empresa_tel, 
      empresa_dir, 
      empresa_propietario,
      empresa_act_eco,
      empresa_dep,
      empresa_dis,
      empresa_ciu,
      empresa_bar,
      empresa_logo_empresa,
      empresa_logo_reporte
    } = body;

    const headerList = await headers();
    const tenantId = headerList.get("x-tenant-id") || body.tenantId || "public";

    if (!empresa_cod) {
      return NextResponse.json({ error: "El código de empresa es requerido para actualizar" }, { status: 400 });
    }

    // UPDATE con SQL puro y nombres de columnas REALES de la BD
    const query = `
      UPDATE "${tenantId}"."empresa"
      SET 
        empresa_nom = $1,
        empresa_nom_fan = $2,
        empresa_ruc = $3,
        empresa_mail = $4,
        empresa_tel = $5,
        empresa_dir = $6,
        empresa_propietario = $7,
        empresa_act_eco = $8,
        empresa_dep = $9,
        empresa_dis = $10,
        empresa_ciu = $11,
        empresa_bar = $12,
        empresa_logo_empresa = $13,
        empresa_logo_reporteria = $14,
        empresa_fecha_mod = $15
      WHERE empresa_cod = $16
    `;

    const params = [
      empresa_nom,
      empresa_nom_fan,
      empresa_ruc,
      empresa_mail,
      empresa_tel,
      empresa_dir,
      empresa_propietario,
      empresa_act_eco ? parseInt(empresa_act_eco) : null,
      empresa_dep ? parseInt(empresa_dep) : null,
      empresa_dis ? parseInt(empresa_dis) : null,
      empresa_ciu ? parseInt(empresa_ciu) : null,
      empresa_bar ? parseInt(empresa_bar) : null,
      empresa_logo_empresa,
      empresa_logo_reporte,
      new Date(),
      parseInt(empresa_cod.toString())
    ];

    console.log("Ejecutando SQL UPDATE Final en:", tenantId);
    await (prisma as any).$executeRawUnsafe(query, ...params);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT Empresa SQL Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
