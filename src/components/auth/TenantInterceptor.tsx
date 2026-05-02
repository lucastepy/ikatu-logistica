"use client";

import { useEffect } from "react";

/**
 * TenantInterceptor
 * Este componente realiza un "monkey-patch" global de window.fetch.
 * Inyecta automáticamente el header 'x-tenant-id' en todas las peticiones a /api/
 * basándose en la información del usuario guardada en localStorage.
 */
export default function TenantInterceptor() {
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      let [resource, config] = args;

      // Solo intervenimos en peticiones a nuestra propia API
      // Evitamos intervenir en el login para no crear bucles o problemas de auth inicial
      const isApiCall = typeof resource === 'string' && resource.startsWith('/api/');
      const isAuthCall = typeof resource === 'string' && resource.includes('/api/auth/');

      if (isApiCall && !isAuthCall) {
        try {
          const userJson = localStorage.getItem("user");
          const user = userJson ? JSON.parse(userJson) : null;
          const tenantId = user?.tenantId;
          const userEmail = user?.email;
          const userProfile = user?.perfilId;

          if (tenantId || userEmail || userProfile) {
            config = config || {};
            
            // Inicializar headers si no existen
            const headers = new Headers(config.headers || {});
            
            // Inyectar el tenantId si no ha sido sobreescrito manualmente
            if (tenantId && !headers.has('x-tenant-id')) {
              headers.set('x-tenant-id', tenantId);
            }

            // Inyectar información de seguridad para Restricciones de Campos
            if (userEmail && !headers.has('x-user-email')) {
              headers.set('x-user-email', userEmail);
            }

            if (userProfile && !headers.has('x-user-profile')) {
              headers.set('x-user-profile', userProfile.toString());
            }
            
            config.headers = headers;
          }
        } catch (error) {
          console.error("Error in TenantInterceptor:", error);
        }
      }

      return originalFetch(resource, config);
    };

    // Devolvemos el fetch original al desmontar (aunque en RootLayout esto no debería pasar)
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null; // Este componente no renderiza nada visual
}
