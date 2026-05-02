import { NextResponse } from "next/server";
import { prismaPublic as prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Usuario y contraseña requeridos" }, { status: 400 });
    }

    const adminUser = await prisma.usuarioAdmin.findUnique({
      where: { usr_admin_username: username }
    });

    if (!adminUser) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, adminUser.usr_admin_password);

    if (!isValid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    // Aquí en un entorno real se crearía una cookie de sesión (JWT)
    // Para simplificar, devolvemos el usuario sin la contraseña
    const { usr_admin_password, ...userWithoutPassword } = adminUser;

    return NextResponse.json({ 
      success: true, 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error("Login Admin Error:", error);
    return NextResponse.json({ error: "Error en la autenticación" }, { status: 500 });
  }
}
