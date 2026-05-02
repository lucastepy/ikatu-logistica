import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // 1. Limpiar restricción conflictiva
    await prisma.$executeRawUnsafe(`ALTER TABLE clientes_saas DROP CONSTRAINT IF EXISTS clientes_saas_unique;`);
    
    // 2. Recrear tablas de forma secuencial para evitar error de múltiples órdenes
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS restricciones_usuarios CASCADE;`);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE restricciones_usuarios (
        res_usr_id SERIAL PRIMARY KEY,
        res_cam_id INTEGER NOT NULL,
        usuario_email VARCHAR(255) NOT NULL,
        res_usr_usuario_alta VARCHAR(50) NOT NULL,
        res_usr_fecha_alta TIMESTAMPTZ DEFAULT NOW(),
        res_usr_usuario_mod VARCHAR(50),
        res_usr_fecha_mod TIMESTAMPTZ,
        CONSTRAINT fk_restriccion FOREIGN KEY (res_cam_id) REFERENCES restricciones_campos(res_cam_id) ON DELETE CASCADE,
        CONSTRAINT fk_usuario FOREIGN KEY (usuario_email) REFERENCES usuarios(usuario_email) ON DELETE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS restricciones_perfiles CASCADE;`);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE restricciones_perfiles (
        res_per_id SERIAL PRIMARY KEY,
        res_cam_id INTEGER NOT NULL,
        perfil_cod INTEGER NOT NULL,
        res_per_usuario_alta VARCHAR(50) NOT NULL,
        res_per_fecha_alta TIMESTAMPTZ DEFAULT NOW(),
        res_per_usuario_mod VARCHAR(50),
        res_per_fecha_mod TIMESTAMPTZ,
        CONSTRAINT fk_restriccion_perf FOREIGN KEY (res_cam_id) REFERENCES restricciones_campos(res_cam_id) ON DELETE CASCADE,
        CONSTRAINT fk_perfil FOREIGN KEY (perfil_cod) REFERENCES perfiles(perfil_cod) ON DELETE CASCADE
      );
    `);

    return NextResponse.json({ success: true, message: "Tablas recreadas individualmente con éxito. Intente usar el dashboard ahora." });
  } catch (error: any) {
    console.error("Fix DB Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
