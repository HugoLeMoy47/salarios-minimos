/**
 * Utilidades para gestionar el shadow profile (perfil local sin autenticación)
 * Usa IndexedDB para almacenar datos localmente
 */

import { get, set, del } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';

export interface LocalItem {
  id: string;
  price: number;
  description: string;
  notes?: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  geohash?: string;
  status: 'pending' | 'purchased' | 'not_purchased';
  postponedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShadowProfile {
  uuid: string;
  items: LocalItem[];
  createdAt: string;
}

const SHADOW_PROFILE_KEY = 'shadow-profile';
const SHADOW_UUID_KEY = 'shadow-uuid';

/**
 * Generar un UUID v4 simple
 */
export function generateUUID(): string {
  // usamos uuidv4, que es RFC‑4122 compliant y ampliamente probado
  return uuidv4();
}

/**
 * Obtener o crear UUID del shadow profile
 */
export async function getShadowUUID(): Promise<string> {
  let uuid = await get<string>(SHADOW_UUID_KEY);
  if (!uuid) {
    uuid = generateUUID();
    await set(SHADOW_UUID_KEY, uuid);
  }
  return uuid;
}

/**
 * Obtener el shadow profile completo
 */
export async function getShadowProfile(): Promise<ShadowProfile | null> {
  const data = await get<ShadowProfile>(SHADOW_PROFILE_KEY);
  return data ?? null;
}

/**
 * Crear un nuevo shadow profile
 */
export async function createShadowProfile(): Promise<ShadowProfile> {
  const uuid = await getShadowUUID();
  const profile: ShadowProfile = {
    uuid,
    items: [],
    createdAt: new Date().toISOString(),
  };
  await set(SHADOW_PROFILE_KEY, profile);
  return profile;
}

/**
 * Obtener o crear shadow profile
 */
export async function getOrCreateShadowProfile(): Promise<ShadowProfile> {
  let profile = await getShadowProfile();
  if (!profile) {
    profile = await createShadowProfile();
  }
  return profile;
}

/**
 * Agregar item al shadow profile
 */
export async function addItemToShadowProfile(
  item: Omit<LocalItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<LocalItem> {
  const profile = await getOrCreateShadowProfile();
  const newItem: LocalItem = {
    ...item,
    id: generateUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  profile.items.push(newItem);
  await set(SHADOW_PROFILE_KEY, profile);
  return newItem;
}

/**
 * Actualizar item en shadow profile
 */
export async function updateItemInShadowProfile(
  itemId: string,
  updates: Partial<LocalItem>
): Promise<LocalItem | null> {
  const profile = await getOrCreateShadowProfile();
  const itemIndex = profile.items.findIndex((item) => item.id === itemId);
  if (itemIndex === -1) return null;

  profile.items[itemIndex] = {
    ...profile.items[itemIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await set(SHADOW_PROFILE_KEY, profile);
  return profile.items[itemIndex];
}

/**
 * Eliminar item del shadow profile
 */
export async function deleteItemFromShadowProfile(itemId: string): Promise<boolean> {
  const profile = await getOrCreateShadowProfile();
  const initialLength = profile.items.length;
  profile.items = profile.items.filter((item) => item.id !== itemId);
  if (profile.items.length < initialLength) {
    await set(SHADOW_PROFILE_KEY, profile);
    return true;
  }
  return false;
}

/**
 * Obtener items pendientes del shadow profile
 */
export async function getPendingItems(): Promise<LocalItem[]> {
  const profile = await getOrCreateShadowProfile();
  return profile.items.filter((item) => item.status === 'pending');
}

/**
 * Obtener todos los items del shadow profile
 */
export async function getAllShadowItems(): Promise<LocalItem[]> {
  const profile = await getOrCreateShadowProfile();
  return profile.items;
}

/**
 * Limpiar shadow profile completo
 */
export async function clearShadowProfile(): Promise<void> {
  await del(SHADOW_PROFILE_KEY);
  // Mantener UUID para continuidad
}

/**
 * Fusionar shadow profile con usuario autenticado
 * Retorna los items que se migrarán
 */
export async function prepareShadowProfileMerge(): Promise<LocalItem[]> {
  const profile = await getShadowProfile();
  if (!profile) return [];
  return profile.items;
}

/**
 * Completar fusión del shadow profile (después de que se haya guardado en DB)
 */
export async function completeShadowProfileMerge(): Promise<void> {
  await clearShadowProfile();
}
