import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string, dirId: string }> }) {
  try {
    const { dirId } = await params;
    const body = await request.json();
    console.log("API PUT Body:", body);
    const { 
      telefono, email, barCod, 
      zonId, calle, nroCasa, referencia, lat, lng, fotoUrl, fotoDsc 
    } = body;

    await prisma.$executeRaw`
      UPDATE clientes_direcciones SET
        dir_telefono = ${telefono},
        dir_email = ${email},
        dir_bar_cod = ${parseInt(barCod)},
        zon_id = ${zonId ? parseInt(zonId) : null},
        dir_calle_principal = ${calle},
        dir_nro_casa = ${nroCasa},
        dir_referencia = ${referencia},
        dir_geolocalizacion = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        dir_foto_url = ${fotoUrl},
        dir_foto_descripcion = ${fotoDsc}
      WHERE dir_id = ${dirId}::uuid
    `;

    return NextResponse.json({ message: "Dirección actualizada" });
  } catch (error: any) {
    console.error("Error updating direccion:", error);
    return NextResponse.json({ error: "Error al actualizar dirección" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string, dirId: string }> }) {
  try {
    const { dirId } = await params;
    await prisma.$executeRaw`DELETE FROM clientes_direcciones WHERE dir_id = ${dirId}::uuid`;
    return NextResponse.json({ message: "Dirección eliminada" });
  } catch (error) {
    console.error("Error deleting direccion:", error);
    return NextResponse.json({ error: "Error al eliminar dirección" }, { status: 500 });
  }
}
