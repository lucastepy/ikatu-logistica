import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const empresaId = parseInt(id);
    const empresa = await prisma.empresa.findUnique({
      where: { emp_id: empresaId }
    });
    return NextResponse.json(empresa);
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
    const empresaId = parseInt(id);
    const body = await request.json();
    
    const empresa = await prisma.empresa.update({
      where: { emp_id: empresaId },
      data: {
        emp_razon_social: body.razonSocial,
        emp_nro_doc: body.nroDoc,
        emp_tip_doc_id: body.tipDocId,
        emp_telefono: body.telefono,
        emp_email: body.email,
        emp_web: body.web,
        emp_logo_url: body.logoUrl,
        emp_usuario_mod: body.usuario || "SISTEMA",
        emp_fecha_mod: new Date()
      }
    });

    return NextResponse.json(empresa);
  } catch (error: any) {
    console.error("Error updating empresa:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
