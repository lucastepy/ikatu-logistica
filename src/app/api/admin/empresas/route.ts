import { NextResponse } from "next/server";
import { prismaPublic as prisma } from "@/lib/prisma";
import crypto from "crypto";
import { hashPassword } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const empresas = await prisma.clienteSaas.findMany({
      include: { plan: true },
      orderBy: { cli_saas_cod: 'asc' },
    });
    return NextResponse.json(empresas);
  } catch (error) {
    console.error("Error fetching empresas:", error);
    return NextResponse.json({ error: "Error al obtener empresas" }, { status: 500 });
  }
}

async function sendWelcomeEmail(toEmail: string, companyName: string, tempPass: string) {
  const apiKey = process.env.BREVO_API_KEY || "";
  const fromEmail = "info@ikatusoft.com.py";
  const subject = "Bienvenido a Ikatu Logística - Credenciales de Acceso";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; padding: 40px; border: 1px solid #eee; border-radius: 10px; margin: 20px auto; }
        .header { text-align: center; border-bottom: 2px solid #00aeef; padding-bottom: 20px; }
        .content { padding: 30px 0; }
        .credentials { background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #00aeef; margin: 20px 0; }
        .footer { text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
        .btn { background-color: #00aeef; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-top: 20px; }
        .warning { color: #f44336; font-size: 13px; font-weight: bold; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #00aeef; margin: 0;">Ikatu Logística</h1>
          <p style="margin: 5px 0; color: #666; font-weight: bold; text-transform: uppercase; font-size: 12px;">SaaS Platform</p>
        </div>
        <div class="content">
          <h2 style="color: #333;">Bienvenido a Ikatu Logística</h2>
          <p>Estimado/a representante de <strong>${companyName}</strong>,</p>
          <p>Es un placer darle la bienvenida a nuestra plataforma. Su infraestructura personalizada ha sido inicializada correctamente y ya puede comenzar a gestionar sus operaciones logísticas.</p>
          
          <p>A continuación, le proporcionamos sus credenciales de acceso inicial:</p>
          
          <div class="credentials">
            <p style="margin: 5px 0;"><strong>Usuario:</strong> ${toEmail}</p>
            <p style="margin: 5px 0;"><strong>Contraseña Temporal:</strong> <span style="font-family: monospace; font-size: 16px; color: #f44336;">${tempPass}</span></p>
          </div>

          <p class="warning">⚠️ IMPORTANTE: Por motivos de seguridad, el sistema le solicitará cambiar esta contraseña en su primer inicio de sesión.</p>
          
          <div style="text-align: center;">
            <a href="https://logistica.ikatusoft.com.py/login" class="btn">Acceder al Sistema</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2024 Ikatu Logística SaaS. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  let logEstado = 'ENVIADO';
  let logError = null;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "x-sib-api-key": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: { name: "Ikatu Soft", email: fromEmail },
        to: [{ email: toEmail }],
        subject: subject,
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      logEstado = 'ERROR';
      logError = JSON.stringify(errorData);
      console.error("Error al enviar correo via Brevo:", errorData);
    }
  } catch (error: any) {
    logEstado = 'ERROR';
    logError = error.message || "Excepción desconocida";
    console.error("Excepción al enviar correo:", error);
  } finally {
    // Registrar el log en la base de datos
    await prisma.segEmailLog.create({
      data: {
        log_destinatario: toEmail,
        log_asunto: subject,
        log_cuerpo: htmlContent,
        log_estado: logEstado,
        log_error: logError,
        log_fecha: new Date()
      }
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      nombre, ruc, mail, direccion, telefono, propietario, 
      nombre_fan, tenant, plan_id, initInfra, sourceSchema 
    } = body;

    // Validación de Email (Backend)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (initInfra && (!mail || !emailRegex.test(mail))) {
      return NextResponse.json({ error: "Debe ingresar un correo válido para inicializar la infraestructura" }, { status: 400 });
    }

    // 1. Calcular el siguiente código disponible
    const lastEmpresa = await prisma.clienteSaas.findFirst({
      orderBy: { cli_saas_cod: 'desc' },
      select: { cli_saas_cod: true }
    });
    const nextCod = (lastEmpresa?.cli_saas_cod || 0) + 1;

    // 2. Verificar si el tenant ya existe (Restricción Única)
    if (tenant) {
      const existingTenant = await prisma.clienteSaas.findFirst({
        where: { cli_saas_tenant: tenant }
      });
      if (existingTenant) {
        return NextResponse.json({ error: `El Tenant ID "${tenant}" ya está en uso por otra empresa.` }, { status: 400 });
      }
    }

    // 3. Crear el registro de la empresa
    const empresa = await prisma.clienteSaas.create({
      data: {
        cli_saas_cod: nextCod,
        cli_saas_nom: nombre,
        cli_saas_ruc: ruc,
        cli_saas_estado: 'A',
        cli_saas_mail: mail,
        cli_saas_dir: direccion,
        cli_saas_tel: telefono,
        cli_saas_propietario: propietario,
        cli_saas_nom_fan: nombre_fan,
        cli_saas_tenant: tenant,
        cli_saas_plan_id: plan_id ? parseInt(plan_id.toString()) : null,
        cli_saas_usuario_alta: "SISTEMA"
      }
    });

    // 3. INICIALIZAR INFRAESTRUCTURA (Fase 1 y 2)
    if (initInfra && tenant && sourceSchema) {
      try {
        await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${tenant}"`);

        const tables: any[] = await prisma.$queryRawUnsafe(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = $1 AND table_type = 'BASE TABLE'
        `, sourceSchema);

        for (const row of tables) {
          const tableName = row.table_name;
          await prisma.$executeRawUnsafe(`
            CREATE TABLE "${tenant}"."${tableName}" 
            (LIKE "${sourceSchema}"."${tableName}" INCLUDING ALL)
          `);
        }

        const randomPass = crypto.randomBytes(4).toString('hex').toUpperCase();
        const hashedPassword = await hashPassword(randomPass);
        
        await prisma.$executeRawUnsafe(`
          INSERT INTO public.usuarios 
          (usuario_nombre, usuario_email, usuario_password, usuario_estado, 
           usuario_primer_ingreso, usuario_tenantid, perfil_cod, usuario_fecha_creacion)
          VALUES 
          ($1, $2, $3, 'A', true, $4, 1, NOW())
        `, nombre, mail, hashedPassword, tenant);

        await sendWelcomeEmail(mail, nombre, randomPass);

      } catch (infraError) {
        console.error("Error en inicialización de infraestructura:", infraError);
      }
    }

    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Error creating empresa:", error);
    return NextResponse.json({ error: "Error al crear empresa" }, { status: 500 });
  }
}
