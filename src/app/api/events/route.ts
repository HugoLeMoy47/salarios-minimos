/**
 * API Route: /api/events
 * Recibe eventos anonimizados para analytics
 */

import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/events - Registrar evento anonimizado
 * El cliente debe enviar datos ya anonimizados:
 * - salaryDaysBucket (ej: "0-0.9", "1-2.9", "3-6.9", "7+")
 * - geohash6 (geohash de 6 caracteres)
 * - timestamp15min (timestamp truncado a 15 minutos)
 * - eventType (ej: "item_created", "item_purchased")
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, salaryDaysBucket, geohash6, timestamp15min } = body;

    if (!eventType) {
      return NextResponse.json({ error: 'eventType es requerido' }, { status: 400 });
    }

    // Validar que los datos están anonimizados
    const allowedEventTypes = [
      'item_created',
      'item_purchased',
      'item_not_purchased',
      'item_postponed',
    ];
    if (!allowedEventTypes.includes(eventType)) {
      return NextResponse.json({ error: 'eventType no válido' }, { status: 400 });
    }

    // Validar buckets válidos
    const validBuckets = ['0-0.9', '1-2.9', '3-6.9', '7+'];
    if (salaryDaysBucket && !validBuckets.includes(salaryDaysBucket)) {
      return NextResponse.json({ error: 'salaryDaysBucket no válido' }, { status: 400 });
    }

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
  } catch (error) {
    console.error('Error al registrar evento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * GET /api/events/stats - Obtener estadísticas agregadas (admin only)
 * Podría requerir autenticación de admin en el futuro
 */
export async function GET() {
  try {
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
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
