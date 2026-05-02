import { PrismaClient } from "@prisma/client";

// Declaración para TypeScript para evitar errores con globalThis
declare global {
  var prismaClients: Record<string, PrismaClient> | undefined;
}

// Inicializamos el almacén global si no existe
const globalClients = globalThis.prismaClients || {};
if (process.env.NODE_ENV !== "production") {
  globalThis.prismaClients = globalClients;
}

/**
 * Retorna una instancia de Prisma para un esquema específico (Tenant)
 * Utiliza un patrón Singleton global para evitar agotar las conexiones de DB
 */
export function getPrisma(tenantSchema: string = "public"): PrismaClient {
  // 1. Si ya tenemos una instancia para este esquema en el almacén global, la reutilizamos
  if (globalClients[tenantSchema]) {
    return globalClients[tenantSchema];
  }

  // 2. Si no existe, creamos una nueva conexión inyectando el esquema en la URL
  const dbUrl = new URL(process.env.DATABASE_URL!);
  
  // Optimizamos el pool de conexiones: 
  // - connection_limit: limite por cliente
  // - pool_timeout: tiempo de espera
  dbUrl.searchParams.set("schema", tenantSchema);
  // Aislamiento estricto: solo el esquema del tenant es visible
  dbUrl.searchParams.set("options", `-c search_path=${tenantSchema}`);
  dbUrl.searchParams.set("connection_limit", "5");
  dbUrl.searchParams.set("pool_timeout", "20");

  const newClient = new PrismaClient({
    datasources: {
      db: { url: dbUrl.toString() }
    },
    // Opcional: Logging para depuración en desarrollo
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // 3. Guardamos en el almacén global y retornamos
  globalClients[tenantSchema] = newClient;
  return newClient;
}

// Exportamos una instancia por defecto para el esquema public
export const prismaPublic = getPrisma("public");

// Exportamos un alias 'prisma' por compatibilidad con código existente
export const prisma = prismaPublic;
