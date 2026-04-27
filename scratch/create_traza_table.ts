import prisma from "./src/lib/prisma";

async function main() {
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS viaje_trazabilidad (
        via_tra_id INTEGER PRIMARY KEY,
        via_tra_via_id INTEGER NOT NULL,
        via_tra_estado_ant VARCHAR(50),
        via_tra_estado_nue VARCHAR(50) NOT NULL,
        via_tra_fecha TIMESTAMPTZ DEFAULT NOW(),
        via_tra_usuario VARCHAR(50) NOT NULL,
        via_tra_observacion VARCHAR(255),
        CONSTRAINT fk_viaje FOREIGN KEY (via_tra_via_id) REFERENCES viajes(via_id) ON DELETE CASCADE
      );
    `;
    console.log("Tabla de trazabilidad creada exitosamente.");
  } catch (e) {
    console.error("Error al crear la tabla:", e);
  }
}

main();
