/**
 * Utilidades de geolocalización y geohashing para anonimización
 */

import * as geohash from 'geohash';

/**
 * Convertir coordenadas a geohash de baja resolución (6 caracteres)
 * @param latitude Latitud
 * @param longitude Longitud
 * @returns Geohash de 6 caracteres
 */
export function coordinatesToGeohash6(latitude: number, longitude: number): string {
  try {
    const hash = geohash.encode(latitude, longitude);
    return hash.substring(0, 6);
  } catch {
    return '';
  }
}

/**
 * Solicitar permiso de geolocalización del navegador
 * @returns Coordenadas {latitude, longitude} o null si se rechaza
 */
export async function requestGeolocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation no soportada en este navegador');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Error de geolocalización:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutos
      }
    );
  });
}

/**
 * Obtener geohash de la posición actual
 */
export async function getCurrentGeohash6(): Promise<string | null> {
  try {
    const location = await requestGeolocation();
    if (!location) return null;
    return coordinatesToGeohash6(location.latitude, location.longitude);
  } catch {
    return null;
  }
}

/**
 * Truncar timestamp a 15 minutos para anonimización
 * Retorna un Date truncado al cuarto de hora más cercano
 */
export function truncateTimestampTo15Min(date: Date = new Date()): Date {
  const minutes = date.getMinutes();
  const truncatedMinutes = Math.floor(minutes / 15) * 15;
  const truncatedDate = new Date(date);
  truncatedDate.setMinutes(truncatedMinutes);
  truncatedDate.setSeconds(0);
  truncatedDate.setMilliseconds(0);
  return truncatedDate;
}
