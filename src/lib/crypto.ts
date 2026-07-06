/**
 * Utilidades de cifrado para copias de seguridad (AES-256-GCM, autenticado)
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { logger } from './logger';

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// La clave puede tener cualquier longitud/entropía; se deriva a 32 bytes (AES-256) vía SHA-256.
function deriveKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || 'default-dev-key-change-in-production';
  return createHash('sha256').update(secret).digest();
}

/**
 * Cifrar datos JSON
 * Formato de salida: base64([iv][authTag][ciphertext])
 */
export function encryptData(data: unknown): string {
  try {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', deriveKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(jsonString, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
  } catch (error) {
    logger.error({ err: error }, 'Error al cifrar');
    throw new Error('No se pudo cifrar los datos');
  }
}

/**
 * Descifrar datos JSON
 */
export function decryptData(encryptedData: string): unknown {
  try {
    const buffer = Buffer.from(encryptedData, 'base64');
    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv('aes-256-gcm', deriveKey(), iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
      'utf8'
    );
    return JSON.parse(decrypted);
  } catch (error) {
    logger.error({ err: error }, 'Error al descifrar');
    throw new Error('No se pudo descifrar los datos');
  }
}

/**
 * Generar hash SHA256 de un archivo para validación
 */
export function hashData(data: unknown): string {
  try {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    return createHash('sha256').update(jsonString).digest('hex');
  } catch (error) {
    logger.error({ err: error }, 'Error al hashear');
    throw new Error('No se pudo hashear los datos');
  }
}
