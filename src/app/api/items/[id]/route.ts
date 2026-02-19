/**
 * API Route: /api/items/[id]
 * Manejo de items individuales
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/items/:id - Obtener un item específico
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
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

    const item = await prisma.item.findUnique({
      where: { id: id },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    if (item.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error al obtener item:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * PUT /api/items/:id - Actualizar un item
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
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

    const existingItem = await prisma.item.findUnique({
      where: { id: id },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    if (existingItem.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const updatedItem = await prisma.item.update({
      where: { id: id },
      data: {
        price: body.price !== undefined ? parseFloat(body.price) : undefined,
        description: body.description,
        notes: body.notes,
        photoUrl: body.photoUrl,
        status: body.status,
        postponedUntil: body.postponedUntil ? new Date(body.postponedUntil) : undefined,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error al actualizar item:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/items/:id - Eliminar un item
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
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

    const existingItem = await prisma.item.findUnique({
      where: { id: id },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    if (existingItem.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.item.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Item eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar item:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
