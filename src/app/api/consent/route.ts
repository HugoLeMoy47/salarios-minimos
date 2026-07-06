/**
 * API Route: /api/consent
 * Registro de consentimientos del usuario
 */

import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { ConsentSchema, parseAndValidate } from '@/lib/validation';
import { withApiHandler } from '@/lib/api-handler';
import { logger } from '@/lib/logger';

/**
 * POST /api/consent - Registrar consentimiento
 * Body: { type: 'notifications' | 'geolocation' | 'analytics', consent: boolean }
 */
export const POST = withApiHandler(async (request: NextRequest) => {
  logger.debug('POST /api/consent called');
  const body = await request.json();
  const result = parseAndValidate(ConsentSchema, body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validación fallida', details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { type, consent, userId } = result.data;

  const consentLog = await prisma.consentLog.create({
    data: {
      userId: userId || null,
      type,
      consent,
      timestamp: new Date(),
    },
  });

  return NextResponse.json(consentLog, { status: 201 });
});
