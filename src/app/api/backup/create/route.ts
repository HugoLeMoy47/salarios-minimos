/**
 * API Route: /api/backup/create
 * Crear y exportar backup cifrado
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptData, hashData } from '@/lib/crypto';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/api-handler';
import { logger } from '@/lib/logger';

/**
 * POST /api/backup/create - Crear backup de datos
 * Retorna JSON cifrado con los datos del usuario
 */
export const POST = withApiHandler(async () => {
  logger.debug('POST /api/backup/create called');
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      items: true,
      shadowProfile: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  // Preparar datos para backup
  const backupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    user: {
      email: user.email,
      name: user.name,
    },
    items: user.items.map((item: (typeof user.items)[0]) => ({
      price: item.price,
      description: item.description,
      notes: item.notes,
      photoUrl: item.photoUrl,
      status: item.status,
      postponedUntil: item.postponedUntil,
      createdAt: item.createdAt,
    })),
    shadowProfile: user.shadowProfile
      ? {
          uuid: user.shadowProfile.uuid,
          mergedAt: user.shadowProfile.mergedAt,
        }
      : null,
  };

  // Cifrar datos
  const encryptedData = encryptData(backupData);
  const hash = hashData(backupData);

  // Guardar registro de backup en la BD
  const backup = await prisma.backup.create({
    data: {
      userId: user.id,
      encryptedData,
    },
  });

  return NextResponse.json(
    {
      id: backup.id,
      encryptedData,
      hash,
      exportedAt: backupData.exportedAt,
      itemCount: backupData.items.length,
      message: 'Backup creado exitosamente. Descarga el archivo JSON cifrado.',
    },
    { status: 201 }
  );
});
