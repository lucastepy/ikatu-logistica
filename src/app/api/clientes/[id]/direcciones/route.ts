import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const direcciones = await prisma.$queryRaw`
      SELECT 
        dir_id, cli_id, dir_telefono, dir_email, 
        dir_bar_cod,
        zon_id, dir_calle_principal, dir_nro_casa, dir_referencia,
        dir_foto_url, dir_foto_descripcion,
        ST_X(dir_geolocalizacion::geometry) as lng,
        ST_Y(dir_geolocalizacion::geometry) as lat
      FROM clientes_direcciones
      WHERE cli_id = ${id}::uuid
    `;
    
    return NextResponse.json(direcciones);
  } catch (error) {
    console.error("Error fetching direcciones:", error);
    return NextResponse.json({ error: "Error al obtener direcciones" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log("API POST Body:", body);
    const { 
      telefono, email, barCod, 
      zonId, calle, nroCasa, referencia, lat, lng, fotoUrl, fotoDsc 
    } = body;

    const nextId = crypto.randomUUID();

    await prisma.$executeRaw`
      INSERT INTO clientes_direcciones (
        dir_id, cli_id, dir_telefono, dir_email, 
        dir_bar_cod,
        zon_id, dir_calle_principal, dir_nro_casa, dir_referencia,
        dir_geolocalizacion, dir_foto_url, dir_foto_descripcion
      )
      VALUES (
        ${nextId}::uuid, ${id}::uuid, ${telefono}, ${email},
        ${parseInt(barCod)},
        ${zonId ? parseInt(zonId) : null}, ${calle}, ${nroCasa}, ${referencia},
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        ${fotoUrl}, ${fotoDsc}
      )
    `;

    return NextResponse.json({ message: "Dirección creada" });
  } catch (error: any) {
    console.error("Error creating direccion:", error);
    return NextResponse.json({ error: "Error al crear dirección" }, { status: 500 });
  }
}
