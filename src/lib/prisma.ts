/**
 * Cliente de Prisma para acceso a la bases de datos
 * Nota: Inicialización en runtime según sea necesario
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedPrisma: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPrismaClient(): any {
  if (!cachedPrisma && typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaClient } = require('@prisma/client');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const globalAny = global as any;
      if (!globalAny.__prisma_client__) {
        globalAny.__prisma_client__ = new PrismaClient();
      }
      cachedPrisma = globalAny.__prisma_client__;
    } catch {
      // Prisma not available - will fail at runtime if accessed
    }
  }
  return cachedPrisma;
}

// Export a proxy object that will initialize Prisma on first access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new Proxy({} as Record<string, any>, {
  get: (target, prop) => {
    const client = getPrismaClient();
    if (!client) {
      throw new Error(
        'Prisma not initialized. Make sure DATABASE_URL is set and Prisma is properly configured.'
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client as any)[prop];
  },
});

export { prisma };
export default prisma;
