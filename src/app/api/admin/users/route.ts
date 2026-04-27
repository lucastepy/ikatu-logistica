import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

// GET: Listar todos los usuarios
export async function GET() {
  try {
    const users = await prisma.usuario.findMany({
      include: {
        empresa: { select: { empresa_nom: true } },
        sucursal: { select: { suc_nombre: true } },
        perfil: { select: { perfil_nombre: true } }
      },
      orderBy: { usuario_fecha_creacion: 'desc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

// POST: Crear un nuevo usuario
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, nombre, password, perfil_cod, empresa_cod, sucursal_id, tenantId } = body;

    // Verificar si ya existe
    const existing = await prisma.usuario.findUnique({
      where: { usuario_email: email }
    });

    if (existing) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password || "1234"); // Default password if none provided

    const newUser = await prisma.usuario.create({
      data: {
        usuario_email: email.toLowerCase().trim(),
        usuario_nombre: nombre,
        usuario_password: hashedPassword,
        perfil_cod: parseInt(perfil_cod),
        usuario_empresa: parseInt(empresa_cod),
        usuario_sucursal: sucursal_id ? parseInt(sucursal_id) : null,
        usuario_tenantid: parseInt(tenantId || "1"),
        usuario_estado: "A",
        usuario_primer_ingreso: true
      }
    });

    return NextResponse.json(newUser);
  } catch (error: any) {
    console.error("Create User Error:", error);
    return NextResponse.json({ error: "Error al crear usuario", details: error.message }, { status: 500 });
  }
}
