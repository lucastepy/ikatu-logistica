import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const deps = await prisma.$queryRaw`SELECT dep_cod, dep_dsc FROM departamentos`;
  console.log('Departamentos:', JSON.stringify(deps, null, 2));
  
  const zonas = await prisma.$queryRaw`SELECT zon_id, zon_nombre FROM zonas LIMIT 15`;
  console.log('Zonas:', JSON.stringify(zonas, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
