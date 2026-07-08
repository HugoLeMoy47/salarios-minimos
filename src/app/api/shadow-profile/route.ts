/**
 * API Route: /api/shadow-profile
 * Manejo de fusión de shadow profiles con usuarios autenticados
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { ShadowMergeSchema, ShadowUuidBodySchema, parseAndValidate } from '@/lib/validation';
import { withApiHandler } from '@/lib/api-handler';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { toPrismaItemStatus } from '@/services/item.service';

/**
 * POST /api/shadow-profile/merge
 * Fusionar shadow profile local con usuario autenticado.
 *
 * Idempotencia: si el shadow profile ya fue fusionado con este mismo usuario
 * (mergedAt poblado), la operación no re-migra los items — evita duplicados
 * cuando el cliente reintenta tras un fallo de red.
 * Atomicidad: la creación del profile y la migración de items corren dentro
 * de una transacción; un fallo a mitad de la migración revierte todo.
 */
export const POST = withApiHandler(async (request: NextRequest) => {
  logger.debug('POST /api/shadow-profile called');
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const result = parseAndValidate(ShadowMergeSchema, body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validación fallida', details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { shadowUUID, localItems } = result.data;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const existingProfile = await prisma.shadowProfile.findUnique({
    where: { uuid: shadowUUID },
  });

  // Idempotencia: fusión ya realizada para este usuario → no repetir la migración.
  if (existingProfile?.mergedAt && existingProfile.mergedWithUserId === user.id) {
    return NextResponse.json(
      {
        message: 'Shadow profile ya estaba fusionado; no se migraron items nuevamente',
        migratedCount: 0,
        shadowProfile: existingProfile,
      },
      { status: 200 }
    );
  }

  // Un shadow profile fusionado con OTRO usuario no puede re-fusionarse.
  if (existingProfile?.mergedWithUserId && existingProfile.mergedWithUserId !== user.id) {
    return NextResponse.json(
      { error: 'Este shadow profile ya fue fusionado con otra cuenta' },
      { status: 409 }
    );
  }

  const { shadowProfile, migratedCount } = await prisma.$transaction(async (tx) => {
    const profile = existingProfile
      ? await tx.shadowProfile.update({
          where: { uuid: shadowUUID },
          data: {
            mergedWithUserId: user.id,
            mergedAt: new Date(),
          },
        })
      : await tx.shadowProfile.create({
          data: {
            uuid: shadowUUID,
            localDataJSON: JSON.stringify(localItems),
            mergedWithUserId: user.id,
            mergedAt: new Date(),
          },
        });

    const migratedItems = await Promise.all(
      localItems.map((item) =>
        tx.item.create({
          data: {
            userId: user.id,
            price: item.price,
            description: item.description,
            notes: item.notes,
            photoUrl: item.photoUrl,
            latitude: item.latitude,
            longitude: item.longitude,
            geohash: item.geohash,
            status: toPrismaItemStatus(item.status),
            postponedUntil: item.postponedUntil ? new Date(item.postponedUntil) : undefined,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
        })
      )
    );

    return { shadowProfile: profile, migratedCount: migratedItems.length };
  });

  return NextResponse.json(
    {
      message: 'Shadow profile fusionado exitosamente',
      migratedCount,
      shadowProfile,
    },
    { status: 200 }
  );
});

/**
 * DELETE /api/shadow-profile/clear
 * Limpiar datos del shadow profile (GDPR/LPDP)
 */
export const DELETE = withApiHandler(async (request: NextRequest) => {
  logger.debug('DELETE /api/shadow-profile called');

  // Endpoint público y destructivo: límite estricto para frenar barridos de UUIDs.
  const limited = rateLimit(request, { limit: 5, windowMs: 60_000, keyPrefix: 'shadow-delete' });
  if (limited) return limited;

  const body = await request.json();
  const result = parseAndValidate(ShadowUuidBodySchema, body);

  if (!result.success) {
    return NextResponse.json({ error: 'shadowUUID es requerido' }, { status: 400 });
  }

  // Eliminar el shadow profile
  await prisma.shadowProfile.delete({
    where: { uuid: result.data.shadowUUID },
  });

  return NextResponse.json({ message: 'Shadow profile eliminado' });
});
