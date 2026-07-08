/**
 * API Route: /api/health
 * Healthcheck para plataformas de despliegue y monitoreo.
 * Sin autenticación, sin lógica de negocio: verifica que el proceso responda
 * y que la base de datos acepte una consulta trivial.
 */

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error({ err: error }, 'Healthcheck failed');
    return NextResponse.json(
      { status: 'unavailable', timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
