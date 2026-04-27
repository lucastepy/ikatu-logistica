import bcrypt from "bcryptjs";

/**
 * Validates a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}



/**
 * Hashes a password (e.g., for user creation)
 */
export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}
