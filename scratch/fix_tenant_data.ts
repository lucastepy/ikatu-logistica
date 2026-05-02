import { getPrisma } from "./src/lib/prisma.js";

async function fixTenantData() {
  const sourceSchema = "tenant_la_transportadora";
  const targetTenant = "tenant_logistica_sa";
  const prisma = getPrisma("public"); // Usamos public para poder acceder a ambos esquemas vía SQL raw
  
  console.log(`Copying data from ${sourceSchema} to ${targetTenant}...`);
  
  try {
    // 1. Obtener todas las tablas del esquema destino
    const tables: any[] = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 AND table_type = 'BASE TABLE'
    `, targetTenant);

    for (const row of tables) {
      const tableName = row.table_name;
      console.log(`Processing table: ${tableName}`);
      
      // Limpiar tabla destino por si tiene algo
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${targetTenant}"."${tableName}" CASCADE`);
      
      // Copiar datos
      await prisma.$executeRawUnsafe(`
        INSERT INTO "${targetTenant}"."${tableName}" 
        SELECT * FROM "${sourceSchema}"."${tableName}"
      `);
      console.log(`Data copied for ${tableName}`);
    }
    
    console.log("Tenant data migration completed successfully.");
  } catch (e) {
    console.error("Error migrating tenant data:", e);
  } finally {
    process.exit(0);
  }
}

fixTenantData();
