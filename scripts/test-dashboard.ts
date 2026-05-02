import { PrismaClient } from "@prisma/client";

async function test() {
  const dbUrl = new URL(process.env.DATABASE_URL!);
  dbUrl.searchParams.set("schema", "public");
  
  const prisma = new PrismaClient({
    datasources: {
      db: { url: dbUrl.toString() }
    }
  });

  try {
    console.log("Probando conteo de Menus...");
    const menus = await prisma.menu.count();
    console.log("Menus:", menus);

    console.log("Probando conteo de Detalles...");
    const detalles = await prisma.menuDet.count();
    console.log("Detalles:", detalles);

    console.log("Probando conteo de Perfiles...");
    const perfiles = await prisma.perfil.count();
    console.log("Perfiles:", perfiles);

  } catch (err: any) {
    console.error("ERROR DETECTADO:", err.message);
    if (err.code) console.error("Código de error Prisma:", err.code);
  } finally {
    await prisma.$disconnect();
  }
}

test();
