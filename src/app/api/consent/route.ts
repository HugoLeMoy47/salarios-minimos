/**
 * API Route: /api/consent
 * Registro de consentimientos del usuario
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { ConsentSchema, parseAndValidate } from '@/lib/validation';
import { withApiHandler } from '@/lib/api-handler';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/**
 * POST /api/consent - Registrar consentimiento
 * Body: { type: 'notifications' | 'geolocation' | 'analytics', consent: boolean }
 *
 * El userId NUNCA se toma del body: si hay sesión activa se deriva de ella;
 * sin sesión el consentimiento se registra como anónimo (userId: null).
 * Esto evita que un cliente falsifique consentimientos a nombre de otro usuario.
 */
export const POST = withApiHandler(async (request: NextRequest) => {
  logger.debug('POST /api/consent called');

  const limited = rateLimit(request, { limit: 10, windowMs: 60_000, keyPrefix: 'consent' });
  if (limited) return limited;

  const body = await request.json();
  const result = parseAndValidate(ConsentSchema, body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validación fallida', details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { type, consent } = result.data;

  const session = await getServerSession(authOptions);
  let userId: string | null = null;
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }

  const consentLog = await prisma.consentLog.create({
    data: {
      userId,
      type,
      consent,
      timestamp: new Date(),
    },
  });

  return NextResponse.json(consentLog, { status: 201 });
});
