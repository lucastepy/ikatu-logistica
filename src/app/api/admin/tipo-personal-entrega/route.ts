import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Listar todos los tipos de personal de entrega
export async function GET() {
  try {
    const data = await prisma.tipoPersonalEntrega.findMany({
      orderBy: { tip_per_ent_id: 'asc' }
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching tipo-personal-entrega:", error);
    return NextResponse.json({ error: "Error al obtener tipos de personal de entrega" }, { status: 500 });
  }
}

// POST: Crear un nuevo tipo de personal de entrega
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dsc, tenantId, usuario } = body;

    // Autoincremento manual
    const last = await prisma.tipoPersonalEntrega.findFirst({
      orderBy: { tip_per_ent_id: 'desc' }
    });
    const nextId = (last?.tip_per_ent_id || 0) + 1;

    const created = await prisma.tipoPersonalEntrega.create({
      data: {
        tip_per_ent_id: nextId,
        tip_per_ent_dsc: dsc,
        tip_per_ent_est: true,
        tip_per_ent_usuario_alta: usuario || "SISTEMA",
        tip_per_ent_tenantid: parseInt(tenantId || "1")
      }
    });
    return NextResponse.json(created);
  } catch (error) {
    console.error("Error creating tipo-personal-entrega:", error);
    return NextResponse.json({ error: "Error al crear tipo de personal de entrega" }, { status: 500 });
  }
}
