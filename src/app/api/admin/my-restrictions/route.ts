import { NextResponse } from "next/server";
import { prismaPublic as prisma } from "@/lib/prisma";

const toSnakeCase = (str: string) => 
  str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, "");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table");
    const userEmail = request.headers.get("x-user-email");
    const perfilCod = request.headers.get("x-user-profile") 
      ? parseInt(request.headers.get("x-user-profile")!) 
      : null;

    if (!table) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 });
    }

    const snakeTable = toSnakeCase(table);

    // Buscar restricciones aplicables al usuario actual (Búsqueda flexible total)
    const restrictions = await (prisma as any).restriccionesCampos.findMany({
      where: {
        res_cam_tabla: {
          in: [
            table, 
            table.toLowerCase(), 
            table.toLowerCase() + 's',
            table.toLowerCase() + 'es',
            snakeTable,
            snakeTable + 's',
            snakeTable + 'es',
            table.endsWith('s') ? table.slice(0, -1) : table,
            table.endsWith('es') ? table.slice(0, -2) : table
          ],
        },
        OR: [
          { perfiles: { some: { perfil_cod: perfilCod || -1 } } },
          { usuarios: { some: { usuario_email: userEmail || '' } } },
          { AND: [ { perfiles: { none: {} } }, { usuarios: { none: {} } } ] } // Globales
        ]
      },
      select: {
        res_cam_columna: true,
        res_cam_oculto: true,
        res_cam_editable: true
      }
    });

    return NextResponse.json(restrictions);
  } catch (error) {
    console.error("Error fetching my restrictions:", error);
    return NextResponse.json({ error: "Error al obtener restricciones" }, { status: 500 });
  }
}
