import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Listar todo el personal de entrega
export async function GET() {
  try {
    const data = await prisma.personalEntrega.findMany({
      include: { 
        tipo: true 
      },
      orderBy: { per_ent_nombre: 'asc' }
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching personal-entrega:", error);
    return NextResponse.json({ error: "Error al obtener personal de entrega" }, { status: 500 });
  }
}

// POST: Crear nuevo personal de entrega
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      documento, 
      nombre, 
      tipo, 
      licencia, 
      cat_licencia, 
      vto_licencia, 
      telefono, 
      direccion, 
      estado, 
      usuario 
    } = body;

    const created = await prisma.personalEntrega.create({
      data: {
        per_ent_documento: documento,
        per_ent_nombre: nombre,
        per_ent_tipo: parseInt(tipo),
        per_ent_licencia: licencia || null,
        per_ent_cat_licencia: cat_licencia || null,
        per_ent_vto_licencia: vto_licencia ? new Date(vto_licencia) : null,
        per_ent_telefono: telefono || null,
        per_ent_direccion: direccion || null,
        per_ent_estado: estado || 'A',
        per_ent_usuario_alta: usuario || "SISTEMA"
      }
    });
    return NextResponse.json(created);
  } catch (error) {
    console.error("Error creating personal-entrega:", error);
    return NextResponse.json({ error: "Error al crear registro de personal" }, { status: 500 });
  }
}
