/**
 * API Route: /api/backup/restore
 * Restaurar datos desde backup cifrado
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decryptData } from '@/lib/crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/backup/restore - Restaurar datos desde backup cifrado
 * Body: { encryptedData: string }
 */
export async function POST(request: NextRequest) {
  try {
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
    let backupData: Record<string, unknown>;
    try {
      backupData = decryptData(encryptedData) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: 'No se pudo desencriptar el backup. Verifica que sea válido.' },
        { status: 400 }
      );
    }

    // Validar estructura del backup
    if (!backupData.items || !Array.isArray(backupData.items)) {
      return NextResponse.json({ error: 'Formato de backup inválido' }, { status: 400 });
    }

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
            status: item.status || 'pending',
            postponedUntil: item.postponedUntil ? new Date(item.postponedUntil) : undefined,
            createdAt: new Date(item.createdAt),
          },
        });
        restoredCount++;
      } catch (err) {
        console.error('Error restaurando item:', err);
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
  } catch (error) {
    console.error('Error al restaurar backup:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
