import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("email");

    if (!userEmail) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.usuario.findUnique({
      where: { usuario_email: userEmail },
      include: {
        perfil: {
          include: {
            menu: {
              include: {
                detalles: {
                  orderBy: { menu_det_det_orden: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    console.log("DEBUG MENU - Usuario:", user?.usuario_email);
    console.log("DEBUG MENU - Perfil:", user?.perfil?.perfil_nombre);
    console.log("DEBUG MENU - Items encontrados:", user?.perfil?.menu?.detalles?.length || 0);

    if (!user || !user.perfil?.menu) {
      return NextResponse.json({ menu: [], debug: "No user or no menu for profile" });
    }

    const allItems = user.perfil.menu.detalles;
    
    // Group by Hierarchy
    const headers = allItems.filter((item: any) => !item.menu_det_cod_padre || item.menu_det_cod_padre === 0);
    const menuStructure = headers.map((header: any) => ({
      ...header,
      children: allItems.filter((child: any) => child.menu_det_cod_padre === header.menu_det_cod)
    }));

    return NextResponse.json({ menu: menuStructure });
  } catch (error) {
    console.error("Error fetching menu:", error);
    return NextResponse.json({ error: "Fail" }, { status: 500 });
  }
}
