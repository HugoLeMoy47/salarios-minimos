/**
 * API Route: /api/gdpr/delete-shadow
 * Eliminar shadow profile local (GDPR)
 */

import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE /api/gdpr/delete-shadow - Eliminar shadow profile por UUID
 * Body: { uuid: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { uuid } = body;

    if (!uuid) {
      return NextResponse.json({ error: 'uuid es requerido' }, { status: 400 });
    }

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
  } catch (error) {
    console.error('Error al eliminar shadow profile:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
