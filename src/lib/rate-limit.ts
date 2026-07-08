/**
 * Rate limiting in-memory (ventana fija por IP).
 *
 * Limitación conocida: el estado vive en la memoria del proceso, así que en
 * despliegues serverless multi-instancia el límite aplica por instancia, no
 * globalmente. Suficiente para frenar abuso básico en el MVP; si se necesita
 * un límite global, migrar a un backend compartido (p.ej. Upstash Redis)
 * manteniendo esta misma interfaz.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

interface WindowEntry {
  count: number;
  resetAt: number;
}

const windows = new Map<string, WindowEntry>();

// Limpieza periódica para que el Map no crezca sin límite.
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanupExpired(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of windows) {
    if (entry.resetAt <= now) {
      windows.delete(key);
    }
  }
}

function getClientKey(request: NextRequest): string {
  // Detrás de un proxy (Vercel, Railway, nginx) la IP real viaja en x-forwarded-for.
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export interface RateLimitOptions {
  /** Máximo de requests permitidos dentro de la ventana. */
  limit: number;
  /** Duración de la ventana en milisegundos. */
  windowMs: number;
  /** Prefijo para aislar contadores entre endpoints. */
  keyPrefix: string;
}

/**
 * Devuelve una respuesta 429 si el cliente excedió el límite, o null si puede continuar.
 *
 * Uso al inicio de un route handler:
 *   const limited = rateLimit(request, { limit: 30, windowMs: 60_000, keyPrefix: 'events' });
 *   if (limited) return limited;
 */
export function rateLimit(request: NextRequest, options: RateLimitOptions): NextResponse | null {
  const now = Date.now();
  cleanupExpired(now);

  const key = `${options.keyPrefix}:${getClientKey(request)}`;
  const entry = windows.get(key);

  if (!entry || entry.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  entry.count += 1;
  if (entry.count <= options.limit) {
    return null;
  }

  const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  logger.warn({ key, count: entry.count, limit: options.limit }, 'Rate limit exceeded');
  return NextResponse.json(
    { error: 'Demasiadas solicitudes, intenta de nuevo más tarde' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
  );
}
