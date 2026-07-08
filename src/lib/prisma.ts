/**
 * Cliente de Prisma para acceso a la bases de datos
 * Nota: Inicialización lazy-loaded mediante Proxy
 */

import { PrismaClient } from '@/generated/prisma/client';
// Adaptador de driver para SQLite. Si se migra a Postgres (p.ej. Supabase), sustituir
// por @prisma/adapter-pg y actualizar el datasource provider en schema.prisma.
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { retry } from './retry';
import { logger } from './logger';

let cachedPrisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (cachedPrisma) {
    return cachedPrisma;
  }

  if (typeof window !== 'undefined') {
    throw new Error('Prisma client cannot be initialized in the browser');
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    const globalForPrisma = global as unknown as { prisma?: PrismaClient };

    if (!globalForPrisma.prisma) {
      const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
      globalForPrisma.prisma = new PrismaClient({
        adapter,
        errorFormat: 'pretty',
      });
    }

    cachedPrisma = globalForPrisma.prisma;

    return cachedPrisma;
  } catch (error) {
    logger.error({ err: error }, 'Unable to instantiate Prisma Client. Make sure DATABASE_URL is set.');
    throw error;
  }
}

// Lazy-loaded Prisma client via Proxy.
// Resiliencia centralizada: toda operación de modelo (prisma.item.create, …) y
// todo $transaction pasan por retry() con backoff exponencial, de modo que un
// fallo transitorio (SQLITE_BUSY, blip de conexión) se reintenta en cualquier
// ruta sin que cada handler tenga que envolverlo manualmente.
// Nota: dentro de un $transaction, el cliente `tx` que entrega Prisma NO pasa
// por este proxy — la transacción se reintenta como unidad completa, que es la
// semántica correcta.
const prismaHandler: ProxyHandler<PrismaClient> = {
  get: (_target, prop) => {
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];

    // Delegados de modelo (item, user, backup, …): envolver cada método en retry().
    if (
      typeof prop === 'string' &&
      !prop.startsWith('$') &&
      typeof value === 'object' &&
      value !== null
    ) {
      return new Proxy(value as Record<PropertyKey, unknown>, {
        get(delegate, method) {
          const fn = delegate[method];
          if (typeof fn !== 'function') return fn;
          return (...args: unknown[]) =>
            retry(() => (fn as (...a: unknown[]) => Promise<unknown>).apply(delegate, args));
        },
      });
    }

    // $transaction se reintenta como unidad completa (nunca por sentencia).
    if (prop === '$transaction' && typeof value === 'function') {
      return (...args: unknown[]) =>
        retry(() => (value as (...a: unknown[]) => Promise<unknown>).apply(client, args));
    }

    return typeof value === 'function'
      ? (value as (...a: unknown[]) => unknown).bind(client)
      : value;
  },
};

const prisma = new Proxy({} as PrismaClient, prismaHandler);

export { prisma };
export default prisma;
