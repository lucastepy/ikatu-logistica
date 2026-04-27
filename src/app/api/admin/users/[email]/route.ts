import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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
      usuario_empresa: parseInt(empresa_cod),
      usuario_sucursal: sucursal_id ? parseInt(sucursal_id) : null,
      usuario_estado: estado,
      usuario_tenantid: parseInt(tenantId || "1")
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
