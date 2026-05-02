import { NextResponse } from "next/server";
import { prismaPublic as prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);
    const body = await request.json();
    const { nombre, password, perfil_cod, empresa_cod, sucursal_id, estado, tenantId } = body;

    const updateData: any = {
      usuario_nombre: nombre,
      perfil_cod: parseInt(perfil_cod),
      usuario_estado: estado,
      usuario_tenantid: tenantId || "tenant_default",
      usuario_fecha_modificacion: new Date(),
      usuario_usuario_modificacion: "SISTEMA"
    };

    // Solo actualizar password si se proporciona
    if (password && password.trim() !== "") {
      updateData.usuario_password = await hashPassword(password);
    }

    const updated = await prisma.usuario.update({
      where: { usuario_email: decodedEmail },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update User Error:", error);
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);

    await prisma.usuario.delete({
      where: { usuario_email: decodedEmail }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete User Error:", error);
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}
