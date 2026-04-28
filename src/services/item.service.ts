/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';
import { retry } from '@/lib/retry';

// Simple cache with 60s TTL to avoid repeated DB hits for the same user
const userItemsCache = new Map<string, { timestamp: number; data: any[] }>();

export async function findItemsByUser(userId: string): Promise<any[]> {
  const now = Date.now();
  const cached = userItemsCache.get(userId);
  if (cached && now - cached.timestamp < 60_000) {
    return cached.data;
  }
  const items = await retry(() =>
    prisma.item.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  );
  userItemsCache.set(userId, { timestamp: now, data: items });
  return items;
}

export async function createItem(data: any): Promise<any> {
  return retry(() => prisma.item.create({ data }));
}

export async function updateItem(id: string, data: any): Promise<any> {
  return retry(() => prisma.item.update({ where: { id }, data }));
}

export async function findItemById(id: string): Promise<any | null> {
  return retry(() => prisma.item.findUnique({ where: { id } }));
}

export async function deleteItem(id: string): Promise<any> {
  return retry(() => prisma.item.delete({ where: { id } }));
}
