import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Multi-Tenant Query Wrapper
 * Ensures tenant isolation by automatically adding empresa_cod filters
 */
export async function getTenantData(tenantId: number) {
  return {
    getUsers: () => prisma.usuario.findMany({ where: { usuario_tenantid: tenantId } }),
    getSucursales: () => prisma.sucursal.findMany({ where: { suc_tenantid: tenantId } }),
    getParametros: () => prisma.parametro.findMany({ where: { par_tenantid: tenantId } }),
    
    getEmpresaBalance: async () => {
      const empresa = await prisma.empresa.findUnique({
        where: { empresa_cod: tenantId },
        select: { empresa_saldo: true }
      });
      return empresa?.empresa_saldo ?? 0;
    },
    
    /**
     * Middleware-like check for Prepaid Balance
     * Rejects operation if balance is insufficient
     */
    verifyBalance: async (requiredAmount: number) => {
      const saldo = await prisma.empresa.findUnique({
        where: { empresa_cod: tenantId },
        select: { empresa_saldo: true }
      });
      
      if (!saldo || (saldo.empresa_saldo as any) < requiredAmount) {
        throw new Error("Saldo insuficiente en Bolsa Prepago.");
      }
      return true;
    }
  };
}
