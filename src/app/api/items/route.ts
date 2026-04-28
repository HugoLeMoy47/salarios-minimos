/**
 * API Route: /api/items
 * Manejo de items para usuarios autenticados
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { CreateItemSchema, UpdateItemSchema, parseAndValidate } from '@/lib/validation';
import { withApiHandler } from '@/lib/api-handler';
import { logger } from '@/lib/logger';

/**
 * GET /api/items - Obtener todos los items del usuario autenticado
 */
export const GET = withApiHandler(async () => {
  logger.debug('GET /api/items called');
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

  const { findItemsByUser } = await import('@/services/item.service');
  const items = await findItemsByUser(user.id);

  // Cache por 60 segundos
  const response = NextResponse.json(items);
  response.headers.set('Cache-Control', 'private, max-age=60');
  return response;
});

/**
 * POST /api/items - Crear nuevo item
 */
export const POST = withApiHandler(async (request: NextRequest) => {
  logger.debug('POST /api/items called');
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body = await request.json();

  // Validar entrada con Zod
  const result = parseAndValidate(CreateItemSchema, body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Validación fallida',
        details: result.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { price, description, notes, photoUrl, latitude, longitude, geohash } = result.data;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

const { createItem } = await import('@/services/item.service');
  const item = await createItem({
        userId: user.id,
        price,
        description,
        notes,
        photoUrl,
        latitude,
        longitude,
        geohash,
        status: 'pending',
      });

  return NextResponse.json(item, { status: 201 });
});

/**
 * PUT /api/items/:id - Actualizar item
 */
export const PUT = withApiHandler(async (request: NextRequest) => {
  logger.debug('PUT /api/items called');
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

  // Validar entrada con Zod
  const result = parseAndValidate(UpdateItemSchema, body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Validación fallida',
        details: result.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  // Verificar que el item pertenece al usuario
const { findItemById } = await import('@/services/item.service');
    const existingItem = await findItemById(itemId);

  if (!existingItem || existingItem.userId !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { updateItem } = await import('@/services/item.service');
  const updatedItem = await updateItem(itemId, result.data);

  return NextResponse.json(updatedItem);
});
