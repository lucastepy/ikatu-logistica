import { getPrisma } from "@/lib/prisma";
import { headers } from "next/headers";

const toSnakeCase = (str: string) => 
  str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, "");

/**
 * Cliente de Prisma extendido que resuelve el Tenant de forma dinámica y aplica
 * restricciones de campos (visibilidad y edición) basadas en perfiles y usuarios.
 */
const baseClient = getPrisma("public");

async function getRequestInfo() {
  try {
    const headerList = await headers();
    return {
      tenantId: headerList.get("x-tenant-id") || "public",
      userEmail: headerList.get("x-user-email") || null,
      perfilCod: headerList.get("x-user-profile") ? parseInt(headerList.get("x-user-profile")!) : null
    };
  } catch (e) {
    return { tenantId: "public", userEmail: null, perfilCod: null };
  }
}

export const prisma = baseClient.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const { tenantId, userEmail, perfilCod } = await getRequestInfo();
        
        // Modelos que son globales y siempre viven en el esquema 'public'
        const globalModels = [
          'RestriccionesCampos', 
          'RestriccionesPerfiles', 
          'RestriccionesUsuarios',
          'Usuario',
          'Perfil',
          'Menu',
          'MenuDet',
          'ClienteSaas',
          'Plan',
          'PlanComponente',
          'PlanMatrizEscalonada',
          'Moneda',
          'UsuarioAdmin',
          'SegEmailLog',
          'Parametro'
        ];

        const isGlobal = globalModels.includes(model);
        const tenantPrisma = isGlobal ? baseClient : getPrisma(tenantId);
        
        // Convertir nombre de modelo a camelCase para acceder al cliente de Prisma
        // (Ej: RestriccionesCampos -> restriccionesCampos)
        const modelKey = model.charAt(0).toLowerCase() + model.slice(1);
        
        const snakeTable = toSnakeCase(model);

        // 1. Obtener restricciones aplicables (Búsqueda flexible total)
        const restrictions = await (baseClient as any).restriccionesCampos.findMany({
          where: {
            res_cam_tabla: {
              in: [
                model, 
                model.toLowerCase(), 
                model.toLowerCase() + 's', 
                model.toLowerCase() + 'es',
                snakeTable,
                snakeTable + 's',
                snakeTable + 'es',
                model.endsWith('s') ? model.slice(0, -1) : model, 
                model.endsWith('es') ? model.slice(0, -2) : model,
                modelKey
              ],
            },
            OR: [
              { perfiles: { some: { perfil_cod: perfilCod || -1 } } },
              { usuarios: { some: { usuario_email: userEmail || '' } } },
              { AND: [ { perfiles: { none: {} } }, { usuarios: { none: {} } } ] } // Globales
            ]
          }
        });

        // 2. Control de Edición (Create/Update)
        if (operation === 'create' || operation === 'update' || operation === 'updateMany' || operation === 'upsert') {
          const nonEditable = restrictions
            .filter((r: any) => r.res_cam_editable === false)
            .map((r: any) => r.res_cam_columna);
          
          if (nonEditable.length > 0) {
            // Eliminar campos no editables de los datos de entrada
            if (args.data) {
              nonEditable.forEach((col: string) => {
                delete args.data[col];
              });
            }
          }
        }

        // 3. Ejecutar consulta
        // IMPORTANTE: Si el modelo es global, usamos query(args) para mantener el contexto
        // de la transacción actual (si existe). Si no es global, usamos el cliente del tenant.
        const result = isGlobal 
          ? await query(args)
          : await (tenantPrisma as any)[modelKey][operation](args);

        // 4. Control de Visibilidad (Post-procesamiento)
        if (result && (operation === 'findUnique' || operation === 'findFirst' || operation === 'findMany')) {
          const hidden = restrictions
            .filter((r: any) => r.res_cam_oculto === true)
            .map((r: any) => r.res_cam_columna);

          if (hidden.length > 0) {
            const maskFields = (obj: any) => {
              if (!obj) return obj;
              hidden.forEach((col: string) => {
                if (col in obj) obj[col] = null; // O delete obj[col]
              });
              return obj;
            };

            if (Array.isArray(result)) return result.map(maskFields);
            return maskFields(result);
          }
        }

        return result;
      },
    },
  },
  client: {
    async $queryRaw(query: any) {
      const { tenantId } = await getRequestInfo();
      return getPrisma(tenantId).$queryRaw(query);
    },
    async $executeRaw(query: any) {
      const { tenantId } = await getRequestInfo();
      return getPrisma(tenantId).$executeRaw(query);
    }
  }
}) as any;
