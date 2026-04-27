import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { verifyPassword } from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.usuario.findFirst({
      where: { 
        usuario_email: { equals: cleanEmail, mode: 'insensitive' }
      },
      include: { 
        empresa: true,
        perfil: {
          include: {
            menu: {
              include: {
                detalles: {
                  where: { menu_cargar_inicio: true },
                  take: 1
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.usuario_password);
    if (!isValid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    // Buscar la URL de inicio configurada
    const startItem = user.perfil?.menu?.detalles?.[0];
    const startUrl = startItem?.menu_det_url || "/dashboard-admin";

    return NextResponse.json({
      success: true,
      user: {
        id: user.usuario_id,
        email: user.usuario_email,
        nombre: user.usuario_nombre,
        empresa: user.usuario_empresa,
        tenantId: user.usuario_tenantid,
        redirectTo: startUrl
      }
    });

  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ 
      error: "Error en el servidor", 
      details: error.message 
    }, { status: 500 });
  }
}
