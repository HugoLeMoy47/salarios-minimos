/**
 * Utilidades de cifrado para copias de seguridad
 */

import CryptoJS from 'crypto-js';
import { logger } from './logger';

// Nota: Para producción, usar una clave más segura y almacenarla de forma segura
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-dev-key-change-in-production';

/**
 * Cifrar datos JSON
 */
export function encryptData(data: unknown): string {
  try {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
    return encrypted;
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
    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY).toString(
      CryptoJS.enc.Utf8
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
    return CryptoJS.SHA256(jsonString).toString();
  } catch (error) {
    logger.error({ err: error }, 'Error al hashear');
    throw new Error('No se pudo hashear los datos');
  }
}
