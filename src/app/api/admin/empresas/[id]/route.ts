import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    
    const empresa = await prisma.empresa.update({
      where: { empresa_cod: id },
      data: {
        empresa_nom: body.nombre,
        empresa_ruc: body.ruc,
        empresa_estado: body.estado,
        empresa_mail: body.mail,
        empresa_dir: body.direccion,
        empresa_tel: body.telefono,
        empresa_propietario: body.propietario,
        empresa_nom_fan: body.nombre_fan,
        empresa_act_eco: body.act_eco ? parseInt(body.act_eco) : null,
        empresa_dep: body.dep ? parseInt(body.dep) : null,
        empresa_dis: body.dis ? parseInt(body.dis) : null,
        empresa_ciu: body.ciu ? parseInt(body.ciu) : null,
        empresa_bar: body.bar ? parseInt(body.bar) : null,
      }
    });
    
    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Error updating empresa:", error);
    return NextResponse.json({ error: "Error al actualizar empresa" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // Verificar si tiene usuarios dependientes
    const usuariosCount = await prisma.usuario.count({
      where: { usuario_empresa: id }
    });

    if (usuariosCount > 0) {
      return NextResponse.json({ 
        error: "No se puede eliminar la empresa porque tiene usuarios asociados." 
      }, { status: 400 });
    }

    await prisma.empresa.delete({
      where: { empresa_cod: id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting empresa:", error);
    return NextResponse.json({ error: "Error al eliminar empresa" }, { status: 500 });
  }
}
