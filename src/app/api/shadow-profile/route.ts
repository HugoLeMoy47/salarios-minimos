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
import { logger } from '@/lib/logger';
import { toPrismaItemStatus } from '@/services/item.service';

/**
 * POST /api/shadow-profile/merge
 * Fusionar shadow profile local con usuario autenticado
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

  // Crear/actualizar el shadow profile en la base de datos
  let shadowProfile = await prisma.shadowProfile.findUnique({
    where: { uuid: shadowUUID },
  });

  if (!shadowProfile) {
    shadowProfile = await prisma.shadowProfile.create({
      data: {
        uuid: shadowUUID,
        localDataJSON: JSON.stringify(localItems),
        mergedWithUserId: user.id,
        mergedAt: new Date(),
      },
    });
  } else {
    shadowProfile = await prisma.shadowProfile.update({
      where: { uuid: shadowUUID },
      data: {
        mergedWithUserId: user.id,
        mergedAt: new Date(),
      },
    });
  }

  // Migrar los items locales a la base de datos
  const migratedItems = await Promise.all(
    localItems.map((item) =>
      prisma.item.create({
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

  return NextResponse.json(
    {
      message: 'Shadow profile fusionado exitosamente',
      migratedCount: migratedItems.length,
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
