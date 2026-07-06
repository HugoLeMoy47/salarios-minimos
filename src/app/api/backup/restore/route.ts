/**
 * API Route: /api/backup/restore
 * Restaurar datos desde backup cifrado
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decryptData } from '@/lib/crypto';
import { NextRequest, NextResponse } from 'next/server';
import { BackupDataSchema, parseAndValidate } from '@/lib/validation';
import { withApiHandler } from '@/lib/api-handler';
import { logger } from '@/lib/logger';
import { toPrismaItemStatus } from '@/services/item.service';

/**
 * POST /api/backup/restore - Restaurar datos desde backup cifrado
 * Body: { encryptedData: string }
 */
export const POST = withApiHandler(async (request: NextRequest) => {
  logger.debug('POST /api/backup/restore called');
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const body = await request.json();
  const { encryptedData } = body;

  if (!encryptedData) {
    return NextResponse.json({ error: 'encryptedData es requerido' }, { status: 400 });
  }

  // Desencriptar datos
  let decrypted: unknown;
  try {
    decrypted = decryptData(encryptedData);
  } catch {
    return NextResponse.json(
      { error: 'No se pudo desencriptar el backup. Verifica que sea válido.' },
      { status: 400 }
    );
  }

  const result = parseAndValidate(BackupDataSchema, decrypted);
  if (!result.success) {
    return NextResponse.json({ error: 'Formato de backup inválido' }, { status: 400 });
  }

  const backupData = result.data;

  // Restaurar items
  let restoredCount = 0;
  for (const item of backupData.items) {
    try {
      await prisma.item.create({
        data: {
          userId: user.id,
          price: item.price,
          description: item.description,
          notes: item.notes,
          photoUrl: item.photoUrl,
          status: toPrismaItemStatus(item.status),
          postponedUntil: item.postponedUntil ? new Date(item.postponedUntil) : undefined,
          createdAt: new Date(item.createdAt),
        },
      });
      restoredCount++;
    } catch (err) {
      logger.error({ err }, 'Error restaurando item');
    }
  }

  return NextResponse.json(
    {
      message: 'Backup restaurado exitosamente',
      restoredCount,
      totalItems: backupData.items.length,
    },
    { status: 200 }
  );
});
