/**
 * API Route: /api/shadow-profile
 * Manejo de fusión de shadow profiles con usuarios autenticados
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/shadow-profile/merge
 * Fusionar shadow profile local con usuario autenticado
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { shadowUUID, localItems } = body;

    if (!shadowUUID || !Array.isArray(localItems)) {
      return NextResponse.json(
        { error: 'shadowUUID y localItems son requeridos' },
        { status: 400 }
      );
    }

    // Obtener o crear el usuario
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
      localItems.map((item: Record<string, unknown>) =>
        prisma.item.create({
          data: {
            userId: user.id,
            price: typeof item.price === 'number' ? item.price : 0,
            description: typeof item.description === 'string' ? item.description : '',
            notes: typeof item.notes === 'string' ? item.notes : undefined,
            photoUrl: typeof item.photoUrl === 'string' ? item.photoUrl : undefined,
            latitude: typeof item.latitude === 'number' ? item.latitude : undefined,
            longitude: typeof item.longitude === 'number' ? item.longitude : undefined,
            geohash: typeof item.geohash === 'string' ? item.geohash : undefined,
            status: typeof item.status === 'string' ? item.status : 'pending',
            postponedUntil:
              item.postponedUntil && typeof item.postponedUntil === 'string'
                ? new Date(item.postponedUntil)
                : undefined,
            createdAt:
              item.createdAt && typeof item.createdAt === 'string'
                ? new Date(item.createdAt)
                : new Date(),
            updatedAt:
              item.updatedAt && typeof item.updatedAt === 'string'
                ? new Date(item.updatedAt)
                : new Date(),
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
  } catch (error) {
    console.error('Error al fusionar shadow profile:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/shadow-profile/clear
 * Limpiar datos del shadow profile (GDPR/LPDP)
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { shadowUUID } = body;

    if (!shadowUUID) {
      return NextResponse.json({ error: 'shadowUUID es requerido' }, { status: 400 });
    }

    // Eliminar el shadow profile
    await prisma.shadowProfile.delete({
      where: { uuid: shadowUUID },
    });

    return NextResponse.json({ message: 'Shadow profile eliminado' });
  } catch (error) {
    console.error('Error al eliminar shadow profile:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
