/**
 * API Route: /api/gdpr/delete-account
 * Eliminar cuenta de usuario (GDPR/LPDP)
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * DELETE /api/gdpr/delete-account - Eliminar cuenta y todos sus datos
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { shadowProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Crear solicitud de eliminación
    const deletionRequest = await prisma.deletionRequest.create({
      data: {
        userId: user.id,
        status: 'processing',
      },
    });

    // Eliminar todos los datos del usuario
    // 1. Eliminar items
    await prisma.item.deleteMany({
      where: { userId: user.id },
    });

    // 2. Eliminar backups
    await prisma.backup.deleteMany({
      where: { userId: user.id },
    });

    // 3. Eliminar consentimientos
    await prisma.consentLog.deleteMany({
      where: { userId: user.id },
    });

    // 4. Eliminar shadow profile si existe
    if (user.shadowProfile) {
      await prisma.shadowProfile.delete({
        where: { id: user.shadowProfile.id },
      });
    }

    // 5. Eliminar la cuenta del usuario
    await prisma.user.delete({
      where: { id: user.id },
    });

    // 6. Marcar solicitud como completada
    await prisma.deletionRequest.update({
      where: { id: deletionRequest.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Cuenta y todos los datos eliminados exitosamente',
      deletionRequestId: deletionRequest.id,
    });
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
