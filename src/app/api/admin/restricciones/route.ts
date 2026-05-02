import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function GET() {
  try {
    const restricciones = await prisma.restriccionesCampos.findMany({
      include: {
        perfiles: {
          include: { perfil: true }
        },
        usuarios: {
          include: { usuario: true }
        }
      },
      orderBy: { res_cam_tabla: 'asc' }
    });
    return NextResponse.json(restricciones);
  } catch (error) {
    console.error("GET Restrictions Error:", error);
    return NextResponse.json({ error: "Error al obtener restricciones" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const h = await headers();
    const body = await request.json();
    const { tenantId: selectedTenantId, tabla, columna, oculto, editable, perfiles, usuarios } = body;
    const tenantId = selectedTenantId || h.get('x-tenant-id') || 'public';
    const userEmail = h.get('x-user-email') || 'admin';

    const nueva = await prisma.$transaction(async (tx) => {
      const base = await tx.restriccionesCampos.create({
        data: {
          res_cam_tabla: tabla,
          res_cam_columna: columna,
          res_cam_oculto: !!oculto,
          res_cam_editable: !!editable,
          res_cam_tenantid: tenantId,
          res_cam_usuario_alta: userEmail
        }
      });

      const resId = base.res_cam_id;

      if (perfiles && perfiles.length > 0) {
        await tx.restriccionesPerfiles.createMany({
          data: perfiles.map((p: number) => ({
            res_cam_id: resId,
            perfil_cod: p,
            res_per_usuario_alta: userEmail
          }))
        });
      }

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

    return NextResponse.json(nueva);
  } catch (error) {
    console.error("POST Restriction Error:", error);
    return NextResponse.json({ error: "Error al crear restricción" }, { status: 500 });
  }
}
