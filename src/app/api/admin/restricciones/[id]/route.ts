import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tenantId, tabla, columna, oculto, editable, perfiles, usuarios } = body;
    const h = await headers();
    const userEmail = h.get('x-user-email') || 'admin';

    const resId = parseInt(id);

    const actualizada = await prisma.$transaction(async (tx) => {
      // 1. Limpiar relaciones existentes
      await tx.restriccionesPerfiles.deleteMany({ where: { res_cam_id: resId } });
      await tx.restriccionesUsuarios.deleteMany({ where: { res_cam_id: resId } });

      // 2. Actualizar datos base
      const base = await tx.restriccionesCampos.update({
        where: { res_cam_id: resId },
        data: {
          res_cam_tabla: tabla,
          res_cam_columna: columna,
          res_cam_oculto: !!oculto,
          res_cam_editable: !!editable,
          res_cam_tenantid: tenantId,
          res_cam_usuario_mod: userEmail,
          res_cam_fecha_mod: new Date()
        }
      });

      // 3. Crear nuevas relaciones de perfiles
      if (perfiles && perfiles.length > 0) {
        await tx.restriccionesPerfiles.createMany({
          data: perfiles.map((p: number) => ({
            res_cam_id: resId,
            perfil_cod: p,
            res_per_usuario_alta: userEmail
          }))
        });
      }

      // 4. Crear nuevas relaciones de usuarios
      if (usuarios && usuarios.length > 0) {
        await tx.restriccionesUsuarios.createMany({
          data: usuarios.map((u: string) => ({
            res_cam_id: resId,
            usuario_email: u,
            res_usr_usuario_alta: userEmail
          }))
        });
      }

      return await tx.restriccionesCampos.findUnique({
        where: { res_cam_id: resId },
        include: {
          perfiles: { include: { perfil: true } },
          usuarios: { include: { usuario: true } }
        }
      });
    });

    return NextResponse.json(actualizada);
  } catch (error) {
    console.error("PUT Restriction Error:", error);
    return NextResponse.json({ error: "Error al actualizar restricción" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.restriccionesCampos.delete({
      where: { res_cam_id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Restriction Error:", error);
    return NextResponse.json({ error: "Error al eliminar restricción" }, { status: 500 });
  }
}
