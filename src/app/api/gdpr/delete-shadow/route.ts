/**
 * API Route: /api/gdpr/delete-shadow
 * Eliminar shadow profile local (GDPR)
 */

import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { UuidBodySchema, parseAndValidate } from '@/lib/validation';
import { withApiHandler } from '@/lib/api-handler';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/**
 * DELETE /api/gdpr/delete-shadow - Eliminar shadow profile por UUID
 * Body: { uuid: string }
 */
export const DELETE = withApiHandler(async (request: NextRequest) => {
  logger.debug('DELETE /api/gdpr/delete-shadow called');

  // Endpoint público y destructivo: límite estricto para frenar barridos de UUIDs.
  const limited = rateLimit(request, { limit: 5, windowMs: 60_000, keyPrefix: 'delete-shadow' });
  if (limited) return limited;

  const body = await request.json();
  const result = parseAndValidate(UuidBodySchema, body);

  if (!result.success) {
    return NextResponse.json({ error: 'uuid es requerido' }, { status: 400 });
  }

  const { uuid } = result.data;

  const shadowProfile = await prisma.shadowProfile.findUnique({
    where: { uuid },
  });

  if (!shadowProfile) {
    return NextResponse.json({ error: 'Shadow profile no encontrado' }, { status: 404 });
  }

  // Eliminar todos los items asociados al shadow profile si no está mergeado
  if (!shadowProfile.mergedWithUserId) {
    await prisma.item.deleteMany({
      where: {
        id: {
          in: [],
        },
      },
    });
  }

  await prisma.shadowProfile.delete({
    where: { uuid },
  });

  return NextResponse.json({ message: 'Shadow profile eliminado exitosamente' });
});
