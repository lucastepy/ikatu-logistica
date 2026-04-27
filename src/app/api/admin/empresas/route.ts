import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const empresas = await prisma.empresa.findMany({
      orderBy: { empresa_cod: 'asc' },
      include: {
        actividad: true,
        departamento: true
      }
    });
    return NextResponse.json(empresas);
  } catch (error) {
    console.error("Error fetching empresas:", error);
    return NextResponse.json({ error: "Error al obtener empresas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const existingCount = await prisma.empresa.count();
    if (existingCount >= 1) {
      return NextResponse.json({ error: "Ya existe una empresa registrada. Solo se permite un registro corporativo." }, { status: 400 });
    }

    const body = await request.json();
    const empresa = await prisma.empresa.create({
      data: {
        empresa_nom: body.nombre,
        empresa_ruc: body.ruc,
        empresa_estado: body.estado || 'A',
        empresa_mail: body.mail,
        empresa_dir: body.direccion,
        empresa_tel: body.telefono,
        empresa_propietario: body.propietario,
        empresa_nom_fan: body.nombre_fan,
        empresa_act_eco: body.act_eco ? parseInt(body.act_eco) : null,
        empresa_dep: body.dep ? parseInt(body.dep) : null,
        empresa_dis: body.dis ? parseInt(body.dis) : null,
        empresa_ciu: body.ciu ? parseInt(body.ciu) : null,
        empresa_bar: body.bar ? parseInt(body.bar) : null,
      }
    });
    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Error creating empresa:", error);
    return NextResponse.json({ error: "Error al crear empresa" }, { status: 500 });
  }
}
