import { NextResponse } from "next/server";
import { prismaPublic as prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clienteId = parseInt(id);
    const cliente = await prisma.clienteSaas.findUnique({
      where: { cli_saas_cod: clienteId }
    });
    return NextResponse.json(cliente);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clienteId = parseInt(id);
    const body = await request.json();
    
    const cliente = await prisma.clienteSaas.update({
      where: { cli_saas_cod: clienteId },
      data: {
        cli_saas_nom: body.nombre,
        cli_saas_ruc: body.ruc,
        cli_saas_estado: body.estado || 'A',
        cli_saas_mail: body.mail,
        cli_saas_dir: body.direccion,
        cli_saas_tel: body.telefono,
        cli_saas_propietario: body.propietario,
        cli_saas_nom_fan: body.nombre_fan,
        cli_saas_tenant: body.tenant,
        cli_saas_plan_id: body.plan_id ? parseInt(body.plan_id.toString()) : null,
        cli_saas_usuario_mod: "SISTEMA",
        cli_saas_fecha_mod: new Date()
      }
    });

    return NextResponse.json(cliente);
  } catch (error: any) {
    console.error("Error updating cliente SaaS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clienteId = parseInt(id);

    await prisma.clienteSaas.delete({
      where: { cli_saas_cod: clienteId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Cliente SaaS Error:", error);
    return NextResponse.json({ error: "Error al eliminar cliente SaaS: " + error.message }, { status: 500 });
  }
}
