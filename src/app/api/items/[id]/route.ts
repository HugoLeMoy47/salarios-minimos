/**
 * API Route: /api/items/[id]
 * Manejo de items individuales
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { IdSchema, UpdateItemSchema, parseAndValidate } from '@/lib/validation';
import { withApiHandler } from '@/lib/api-handler';
import { logger } from '@/lib/logger';

/**
 * GET /api/items/:id - Obtener un item específico
 */
export const GET = withApiHandler(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  logger.debug('GET /api/items/[id] called');
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

  const { findItemById } = await import('@/services/item.service');
  const item = await findItemById(idResult.data);

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
});

/**
 * PUT /api/items/:id - Actualizar un item
 */
export const PUT = withApiHandler(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  logger.debug('PUT /api/items/[id] called');
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

  const { findItemById, updateItem } = await import('@/services/item.service');
  const existingItem = await findItemById(idResult.data);

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
        details: dataResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const updatedItem = await updateItem(idResult.data, {
    ...dataResult.data,
    postponedUntil: body.postponedUntil ? new Date(body.postponedUntil) : undefined,
  });

  return NextResponse.json(updatedItem);
});

/**
 * DELETE /api/items/:id - Eliminar un item
 */
export const DELETE = withApiHandler(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  logger.debug('DELETE /api/items/[id] called');
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

  const { findItemById, deleteItem } = await import('@/services/item.service');
  const existingItem = await findItemById(idResult.data);

  if (!existingItem) {
    return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
  }

  if (existingItem.userId !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await deleteItem(idResult.data);

  return NextResponse.json({ message: 'Item eliminado exitosamente' });
});
