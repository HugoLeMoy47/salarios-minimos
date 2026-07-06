import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

// Función auxiliar para envolver los handlers de rutas
export function withApiHandler<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (err) {
      // Loguear de forma estructurada; extraemos lo que podamos del primer argumento
      const req = args[0] as NextRequest | undefined;
      logger.error({ err, url: req?.url, method: req?.method }, 'Unhandled API error');
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
  };
}
