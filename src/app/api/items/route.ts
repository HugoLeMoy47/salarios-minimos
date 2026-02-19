/**
 * API Route: /api/items
 * Manejo de items para usuarios autenticados
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/items - Obtener todos los items del usuario autenticado
 */
export async function GET() {
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

    const items = await prisma.item.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error al obtener items:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * POST /api/items - Crear nuevo item
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { price, description, notes, photoUrl, latitude, longitude, geohash } = body;

    if (!price || !description) {
      return NextResponse.json({ error: 'Precio y descripción son requeridos' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const item = await prisma.item.create({
      data: {
        userId: user.id,
        price: parseFloat(price),
        description,
        notes,
        photoUrl,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        geohash,
        status: 'pending',
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error al crear item:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * PUT /api/items/:id - Actualizar item
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const itemId = url.pathname.split('/').pop();

    if (!itemId) {
      return NextResponse.json({ error: 'ID de item no proporcionado' }, { status: 400 });
    }

    const body = await request.json();
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar que el item pertenece al usuario
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!existingItem || existingItem.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: body,
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error al actualizar item:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
