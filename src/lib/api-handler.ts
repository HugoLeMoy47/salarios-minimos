/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

// Función auxiliar para envolver los handlers de rutas
export function withApiHandler<T extends (...args: any[]) => Promise<NextResponse>>(handler: T): T {
  const wrapped: any = async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (err) {
      // Loguear de forma estructurada; extraemos lo que podamos del primer argumento
      const req: NextRequest | undefined = args[0];
      logger.error(
        { err, url: req?.url, method: req?.method },
        'Unhandled API error'
      );
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
  };
  return wrapped as T;
}
