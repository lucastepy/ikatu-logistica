import prisma from "./src/lib/prisma";

async function main() {
  const estados = await prisma.$queryRaw`SELECT flu_est_id, flu_est_nom FROM flujo_estados`;
  const config = await prisma.$queryRaw`
    SELECT 
      fec.flu_conf_id,
      fec.flu_conf_id_estado_actual,
      fec.flu_conf_id_estado_siguiente,
      fec.flu_conf_etiqueta_accion,
      fec.flu_conf_es_estado_inicial
    FROM flujo_estados_config fec
  `;
  const viaje = await prisma.$queryRaw`SELECT via_id, via_estado FROM viajes WHERE via_id = 1`;

  console.log("ESTADOS:", JSON.stringify(estados, null, 2));
  console.log("CONFIG:", JSON.stringify(config, null, 2));
  console.log("VIAJE #1:", JSON.stringify(viaje, null, 2));
}

main();
