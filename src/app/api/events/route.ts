/**
 * API Route: /api/events
 * Recibe eventos anonimizados para analytics
 */

import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { EventSchema, parseAndValidate } from '@/lib/validation';
import { withApiHandler } from '@/lib/api-handler';
import { logger } from '@/lib/logger';

/**
 * POST /api/events - Registrar evento anonimizado
 * El cliente debe enviar datos ya anonimizados:
 * - salaryDaysBucket (ej: "0-0.9", "1-2.9", "3-6.9", "7+")
 * - geohash6 (geohash de 6 caracteres)
 * - timestamp15min (timestamp truncado a 15 minutos)
 * - eventType (ej: "item_created", "item_purchased")
 */
export const POST = withApiHandler(async (request: NextRequest) => {
  logger.debug('POST /api/events called');
  const body = await request.json();
  const result = parseAndValidate(EventSchema, body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validación fallida', details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { eventType, salaryDaysBucket, geohash6, timestamp15min } = result.data;

  // Guardar evento anonimizado
  const event = await prisma.anonymizedEvent.create({
    data: {
      eventType,
      salaryDaysBucket: salaryDaysBucket || null,
      geohash6: geohash6 || null,
      timestamp15min: timestamp15min ? new Date(timestamp15min) : new Date(),
    },
  });

  return NextResponse.json(event, { status: 201 });
});

/**
 * GET /api/events/stats - Obtener estadísticas agregadas (admin only)
 * Podría requerir autenticación de admin en el futuro
 */
export const GET = withApiHandler(async () => {
  logger.debug('GET /api/events called');
  // Para MVP, retornar estadísticas básicas (sin protección de admin)
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const stats = await prisma.anonymizedEvent.groupBy({
    by: ['eventType', 'salaryDaysBucket'],
    where: {
      createdAt: {
        gte: last7Days,
      },
    },
    _count: true,
  });

  const geohashStats = await prisma.anonymizedEvent.groupBy({
    by: ['geohash6'],
    where: {
      createdAt: {
        gte: last7Days,
      },
      geohash6: {
        not: null,
      },
    },
    _count: true,
  });

  return NextResponse.json({
    period: 'last_7_days',
    eventStats: stats,
    geohashStats: geohashStats,
    generatedAt: new Date().toISOString(),
  });
});
