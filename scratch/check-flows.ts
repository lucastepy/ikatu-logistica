import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const objetos = await prisma.$queryRaw`SELECT obj_id, obj_dsc FROM objetos WHERE obj_dsc ILIKE '%VIAJE%'`;
  const estados = await prisma.$queryRaw`SELECT flu_est_id, flu_est_dsc FROM flujo_estados`;
  const config = await prisma.$queryRaw`SELECT * FROM flujo_estados_config`;
  
  console.log('--- OBJETOS ---');
  console.table(objetos);
  console.log('--- ESTADOS ---');
  console.table(estados);
  console.log('--- CONFIG ---');
  console.table(config);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
