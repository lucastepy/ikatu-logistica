import { AsyncLocalStorage } from "async_hooks";

/**
 * Almacenamiento local asíncrono para mantener el Tenant ID durante el ciclo de vida de la petición.
 * Esto permite acceder al tenant de forma síncrona en cualquier parte del código del servidor.
 */
export const tenantStorage = new AsyncLocalStorage<string>();

export function getTenantId(): string {
  return tenantStorage.getStore() || "public";
}
