const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.usuario.findMany({ take: 5 });
  const companies = await prisma.clienteSaas.findMany({ take: 5 });
  console.log('USERS:', users.map(u => ({ email: u.usuario_email, tenant: u.usuario_tenantid })));
  console.log('COMPANIES:', companies.map(c => ({ cod: c.cli_saas_cod, nom: c.cli_saas_nom })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
