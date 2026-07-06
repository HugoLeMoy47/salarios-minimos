/**
 * Cliente de Prisma para acceso a la bases de datos
 * Nota: Inicialización lazy-loaded mediante Proxy
 */

import { PrismaClient } from '@/generated/prisma/client';
// Adaptador de driver para SQLite. Si se migra a Postgres (p.ej. Supabase), sustituir
// por @prisma/adapter-pg y actualizar el datasource provider en schema.prisma.
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
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

// Lazy-loaded Prisma client via Proxy
const prismaHandler: ProxyHandler<PrismaClient> = {
  get: (_target, prop) => {
    const client = getPrismaClient();
    return client[prop as keyof PrismaClient];
  },
};

const prisma = new Proxy({} as PrismaClient, prismaHandler);

export { prisma };
export default prisma;
