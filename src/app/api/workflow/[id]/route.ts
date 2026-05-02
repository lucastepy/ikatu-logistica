import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
const prisma = getPrisma("tenant_la_transportadora");

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const body = await request.json();
    const { objId, perfilCod, estActId, estSigId, esInicial, etiqueta, usuario } = body;
    const id = parseInt(idParam);

    const updated = await prisma.flujoEstadoConfig.update({
      where: { flu_conf_id: id },
      data: {
        flu_conf_obj_id: parseInt(objId),
        flu_conf_perfil_cod: parseInt(perfilCod),
        flu_conf_id_estado_actual: estActId ? parseInt(estActId) : null,
        flu_conf_id_estado_siguiente: parseInt(estSigId),
        flu_conf_es_estado_inicial: esInicial || false,
        flu_conf_etiqueta_accion: etiqueta,
        flu_conf_usuario_mod: usuario || "SISTEMA",
        flu_conf_fecha_mod: new Date()
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating workflow config:", error);
    return NextResponse.json({ error: "Error al actualizar registro: " + error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    await prisma.flujoEstadoConfig.delete({
      where: { flu_conf_id: id }
    });
    return NextResponse.json({ message: "Registro eliminado" });
  } catch (error: any) {
    console.error("Error deleting workflow config:", error);
    return NextResponse.json({ error: "Error al eliminar registro: " + error.message }, { status: 500 });
  }
}
