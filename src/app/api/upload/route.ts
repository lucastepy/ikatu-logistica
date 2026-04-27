import { NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";

// MÉTODO POST: PARA CARGAR IMÁGENES
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const cliDoc = formData.get("cliDoc") as string; // Documento del cliente para la carpeta
    const dirId = formData.get("dirId") as string;   // ID de dirección para el nombre

    if (!file || !cliDoc) {
      return NextResponse.json({ error: "Faltan datos requeridos (archivo o documento)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ruta: public/uploads/{cliDoc}
    const uploadDir = join(process.cwd(), "public", "uploads", cliDoc);
    
    // Asegurar que el directorio del cliente exista
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {}

    // Nombre: dir_{dirId}_{uuid}.ext
    const fileExtension = file.name.split(".").pop();
    const fileName = `dir_${dirId || 'new'}_${crypto.randomUUID()}.${fileExtension}`;
    const path = join(uploadDir, fileName);

    // Guardar en disco
    await writeFile(path, buffer);
    
    // Retornar la URL pública incluyendo la carpeta del cliente
    const publicUrl = `/uploads/${cliDoc}/${fileName}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 });
  }
}

// MÉTODO DELETE: PARA ELIMINAR IMÁGENES DEL DISCO
export async function DELETE(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "URL requerida" }, { status: 400 });

    // Convertir URL pública en ruta de sistema
    // Ejemplo: /uploads/123456/dir_...jpg -> public/uploads/123456/dir_...jpg
    const filePath = join(process.cwd(), "public", url);

    try {
      await unlink(filePath);
      return NextResponse.json({ message: "Imagen eliminada del disco" });
    } catch (err) {
      console.error("Delete file error:", err);
      return NextResponse.json({ error: "No se pudo eliminar el archivo físico" }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Error en la petición de borrado" }, { status: 500 });
  }
}
