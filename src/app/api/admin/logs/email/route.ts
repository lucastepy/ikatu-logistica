import { NextResponse } from "next/server";
import { prismaPublic as prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.segEmailLog.findMany({
        orderBy: { log_fecha: 'desc' },
        skip,
        take: limit,
      }),
      prisma.segEmailLog.count()
    ]);

    return NextResponse.json({
      logs,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Error fetching email logs:", error);
    return NextResponse.json({ error: "Error al obtener logs de correo" }, { status: 500 });
  }
}

// Endpoint para reenvío (ACTUALIZA EL REGISTRO ORIGINAL)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { logId, nuevoDestinatario } = body;

    const originalLog = await prisma.segEmailLog.findUnique({
      where: { log_id: logId }
    });

    if (!originalLog) {
      return NextResponse.json({ error: "Log no encontrado" }, { status: 404 });
    }

    const apiKey = process.env.BREVO_API_KEY || "";
    const fromEmail = "info@ikatusoft.com.py";
    const destinatario = nuevoDestinatario || originalLog.log_destinatario;

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
        to: [{ email: destinatario }],
        subject: originalLog.log_asunto,
        htmlContent: originalLog.log_cuerpo
      })
    });

    let logEstado = 'ENVIADO';
    let logError = null;

    if (!response.ok) {
      const errorData = await response.json();
      logEstado = 'ERROR';
      logError = JSON.stringify(errorData);
    }

    // ACTUALIZAR EL REGISTRO EXISTENTE
    const updatedLog = await prisma.segEmailLog.update({
      where: { log_id: logId },
      data: {
        log_destinatario: destinatario,
        log_estado: logEstado,
        log_error: logError,
        log_fecha: new Date() // Actualizamos la fecha al intento más reciente
      }
    });

    return NextResponse.json(updatedLog);
  } catch (error: any) {
    console.error("Error en reenvío de correo:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
