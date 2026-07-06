import { prisma } from '@/lib/prisma';
import { retry } from '@/lib/retry';
import { ItemStatus, type Item, type Prisma } from '@/generated/prisma/client';

// Simple cache with 60s TTL to avoid repeated DB hits for the same user
const userItemsCache = new Map<string, { timestamp: number; data: Item[] }>();

export async function findItemsByUser(userId: string): Promise<Item[]> {
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

export async function createItem(data: Prisma.ItemUncheckedCreateInput): Promise<Item> {
  return retry(() => prisma.item.create({ data }));
}

export async function updateItem(
  id: string,
  data: Prisma.ItemUncheckedUpdateInput
): Promise<Item> {
  return retry(() => prisma.item.update({ where: { id }, data }));
}

export async function findItemById(id: string): Promise<Item | null> {
  return retry(() => prisma.item.findUnique({ where: { id } }));
}

export async function deleteItem(id: string): Promise<Item> {
  return retry(() => prisma.item.delete({ where: { id } }));
}

/**
 * Convierte el status usado por el cliente (shadow profile / LocalItem) al
 * enum ItemStatus de Prisma. 'not_purchased' y 'cancelled' mapean a CANCELLED.
 */
export function toPrismaItemStatus(status: string | undefined): ItemStatus {
  switch (status) {
    case 'meditating':
      return ItemStatus.MEDITATING;
    case 'purchased':
      return ItemStatus.PURCHASED;
    case 'not_purchased':
    case 'cancelled':
      return ItemStatus.CANCELLED;
    default:
      return ItemStatus.PENDING;
  }
}
