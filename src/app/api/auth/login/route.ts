import { NextResponse } from "next/server";
import { prismaPublic } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const cleanEmail = email.trim().toLowerCase();
    
    console.log(`[LOGIN] Intento de acceso para: ${cleanEmail}`);

    // 1. Buscar al usuario y su perfil en el esquema PUBLIC
    let user: any;
    try {
      user = await prismaPublic.usuario.findFirst({
        where: { 
          usuario_email: { equals: cleanEmail, mode: 'insensitive' }
        },
        include: { 
          perfil: true
        }
      });
    } catch (dbError: any) {
      console.error("[LOGIN] Error en búsqueda de usuario:", dbError);
      throw new Error(`Database lookup failed: ${dbError.message}`);
    }

    if (!user) {
      console.log(`[LOGIN] Usuario no encontrado: ${cleanEmail}`);
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.usuario_password);
    if (!isValid) {
      console.log(`[LOGIN] Contraseña incorrecta para: ${cleanEmail}`);
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    // 2. Buscar la empresa
    let empresaNom = "Empresa Desconocida";
    if (user.usuario_tenantid) {
      try {
        const empresa = await prismaPublic.clienteSaas.findFirst({
          where: { cli_saas_tenant: user.usuario_tenantid }
        });
        if (empresa) empresaNom = empresa.cli_saas_nom || "Empresa Sin Nombre";
      } catch (e) {}
    }

    // 3. LOGICA DE REDIRECCIÓN DINÁMICA
    let startUrl = "/dashboard-admin"; // Fallback
    const menuCod = user.perfil?.menu_cod;
    
    console.log(`[LOGIN] Perfil: ${user.perfil?.perfil_nombre} (Cod: ${user.perfil_cod}), MenuCod: ${menuCod}`);

    if (menuCod) {
      try {
        // Consultamos explícitamente el objeto inicial
        const startItems: any = await prismaPublic.$queryRaw`
          SELECT menu_det_url, menu_det_nombre, menu_cargar_inicio
          FROM public.menu_det 
          WHERE menu_cod = ${menuCod} AND menu_cargar_inicio = true 
          LIMIT 1
        `;

        console.log(`[LOGIN] Resultado búsqueda pantalla inicial:`, JSON.stringify(startItems));

        if (Array.isArray(startItems) && startItems.length > 0) {
          startUrl = startItems[0].menu_det_url;
          console.log(`[LOGIN] Redirección configurada detectada: ${startUrl}`);
        } else {
          console.log(`[LOGIN] No se encontró pantalla inicial (menu_cargar_inicio=true) para MenuCod: ${menuCod}`);
        }
      } catch (menuError: any) {
        console.error("[LOGIN] Error al buscar objeto inicial:", menuError.message);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.usuario_email,
        email: user.usuario_email,
        nombre: user.usuario_nombre,
        perfilId: user.perfil_cod,
        menuId: menuCod,
        empresa: empresaNom,
        tenantId: user.usuario_tenantid || "public",
        redirectTo: startUrl
      }
    });

  } catch (error: any) {
    console.error("[LOGIN] Error crítico:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
