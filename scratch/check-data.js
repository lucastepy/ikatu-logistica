const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const counts = {
      moviles: await prisma.movil.count(),
      personal: await prisma.personalEntrega.count(),
      formasPago: await prisma.formaPago.count(),
      depositos: await prisma.deposito.count(),
      zonas: await prisma.zona.count(),
      clientes: await prisma.cliente.count(),
    };
    console.log('CONTEO DE DATOS:', JSON.stringify(counts, null, 2));
  } catch (error) {
    console.error('ERROR AL VERIFICAR DATOS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
