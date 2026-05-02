const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function generate() {
  const username = "superadmin";
  const password = "admin_password_123";
  const nombre = "Súper Administrador Global";

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  const uuid = crypto.randomUUID();

  console.log("===============================================");
  console.log("SQL INSERT PARA SÚPER ADMIN (COPIAR Y PEGAR):");
  console.log("===============================================\n");
  console.log(`INSERT INTO public.usuarios_admin (usr_admin_cod, usr_admin_username, usr_admin_password, usr_admin_nombre)`);
  console.log(`VALUES ('${uuid}', '${username}', '${hash}', '${nombre}');`);
  
  console.log("\n===============================================");
  console.log("CREDENCIALES DE ACCESO:");
  console.log(`Usuario: ${username}`);
  console.log(`Password: ${password}`);
  console.log("===============================================");
}

generate();
