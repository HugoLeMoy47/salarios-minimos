/**
 * API Route: /api/items/[id]
 * Manejo de items individuales
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { IdSchema, UpdateItemSchema, parseAndValidate } from '@/lib/validation';

/**
 * GET /api/items/:id - Obtener un item específico
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Validar ID
    const idResult = parseAndValidate(IdSchema, id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

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
      where: { id: idResult.data },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    if (item.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Cache por 60 segundos
    const response = NextResponse.json(item);
    response.headers.set('Cache-Control', 'private, max-age=60');
    return response;
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

    // Validar ID
    const idResult = parseAndValidate(IdSchema, id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

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
      where: { id: idResult.data },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    if (existingItem.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();

    // Validar entrada
    const dataResult = parseAndValidate(UpdateItemSchema, body);
    if (!dataResult.success) {
      return NextResponse.json(
        {
          error: 'Validación fallida',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          details: (dataResult as { success: false; error: any }).error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updatedItem = await prisma.item.update({
      where: { id: idResult.data },
      data: {
        ...dataResult.data,
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

    // Validar ID
    const idResult = parseAndValidate(IdSchema, id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

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
      where: { id: idResult.data },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    if (existingItem.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.item.delete({
      where: { id: idResult.data },
    });

    return NextResponse.json({ message: 'Item eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar item:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
