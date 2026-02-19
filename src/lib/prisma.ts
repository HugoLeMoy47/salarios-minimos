/**
 * Cliente de Prisma para acceso a la bases de datos
 * Nota: Inicialización lazy-loaded mediante Proxy
 */

import type { PrismaClient } from '@prisma/client';

let cachedPrisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (cachedPrisma) {
    return cachedPrisma;
  }

  if (typeof window !== 'undefined') {
    throw new Error('Prisma client cannot be initialized in the browser');
  }

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client');

    const globalForPrisma = global as unknown as { prisma?: PrismaClient };

    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient({
        errorFormat: 'pretty',
      });
    }

    cachedPrisma = globalForPrisma.prisma;

    return cachedPrisma;
  } catch (error) {
    console.error('Unable to instantiate Prisma Client. Make sure DATABASE_URL is set.', error);
    throw error;
  }
}

// Lazy-loaded Prisma client via Proxy
const prismaHandler: ProxyHandler<Record<string, unknown>> = {
  get: (_target, prop) => {
    const client = getPrismaClient();
    // Access via string key since `prop` may be symbol or string
    return (client as unknown as Record<string, unknown>)[String(prop)];
  },
};

const prisma = new Proxy({} as unknown as PrismaClient, prismaHandler);

export { prisma };
export default prisma;
