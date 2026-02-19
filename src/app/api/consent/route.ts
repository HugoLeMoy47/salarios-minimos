/**
 * API Route: /api/consent
 * Registro de consentimientos del usuario
 */

import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/consent - Registrar consentimiento
 * Body: { type: 'notifications' | 'geolocation' | 'analytics', consent: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, consent, userId } = body;

    if (!type || typeof consent !== 'boolean') {
      return NextResponse.json({ error: 'type y consent son requeridos' }, { status: 400 });
    }

    const validTypes = ['notifications', 'geolocation', 'analytics'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'type no válido' }, { status: 400 });
    }

    const consentLog = await prisma.consentLog.create({
      data: {
        userId: userId || null,
        type,
        consent,
        timestamp: new Date(),
      },
    });

    return NextResponse.json(consentLog, { status: 201 });
  } catch (error) {
    console.error('Error al registrar consentimiento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
