/**
 * Tests para geolocalización
 */

import { coordinatesToGeohash6, truncateTimestampTo15Min } from '@/lib/geolocation';

describe('Geolocation Utilities', () => {
  describe('coordinatesToGeohash6', () => {
    it('debería convertir coordenadas a geohash de 6 caracteres', () => {
      const geohash = coordinatesToGeohash6(19.4326, -99.1332); // CDMX
      expect(geohash).toHaveLength(6);
      expect(geohash).toMatch(/^[0-9a-z]+$/);
    });

    it('debería generar geohash diferente para coordenadas diferentes', () => {
      const geohash1 = coordinatesToGeohash6(19.4326, -99.1332); // CDMX
      const geohash2 = coordinatesToGeohash6(25.686, -100.3161); // Monterrey
      expect(geohash1).not.toBe(geohash2);
    });

    it('debería manejar el polo norte', () => {
      const geohash = coordinatesToGeohash6(90, 0);
      expect(geohash).toHaveLength(6);
    });

    it('debería manejar el polo sur', () => {
      const geohash = coordinatesToGeohash6(-90, 0);
      expect(geohash).toHaveLength(6);
    });

    it('debería manejar el meridiano de Greenwich', () => {
      const geohash = coordinatesToGeohash6(0, 0);
      expect(geohash).toHaveLength(6);
    });
  });

  describe('truncateTimestampTo15Min', () => {
    it('debería truncar a 15 minutos correctamente', () => {
      const date = new Date('2024-01-15T10:27:45.000Z');
      const truncated = truncateTimestampTo15Min(date);
      expect(truncated.getMinutes()).toBe(15);
      expect(truncated.getSeconds()).toBe(0);
      expect(truncated.getMilliseconds()).toBe(0);
    });

    it('debería redondear hacia abajo', () => {
      const date = new Date('2024-01-15T10:37:00.000Z');
      const truncated = truncateTimestampTo15Min(date);
      expect(truncated.getMinutes()).toBe(30);
    });

    it('debería truncar los minutos correctamente sin alterar demasiado la hora', () => {
      // Creamos una fecha en UTC y comprobamos que los minutos se ajustan a un múltiplo de 15
      const date = new Date(Date.UTC(2024, 0, 15, 10, 27, 45));
      const truncated = truncateTimestampTo15Min(date);
      const minutes = truncated.getUTCMinutes();
      expect(minutes % 15).toBe(0);
    });

    it('debería mantener la fecha correcta', () => {
      const date = new Date('2024-01-15T10:27:45.000Z');
      const truncated = truncateTimestampTo15Min(date);
      expect(truncated.getDate()).toBe(15);
      expect(truncated.getMonth()).toBe(0);
      expect(truncated.getFullYear()).toBe(2024);
    });

    it('debería usar la fecha actual si no se proporciona', () => {
      const truncated = truncateTimestampTo15Min();
      expect(truncated).toBeInstanceOf(Date);
      expect(truncated.getSeconds()).toBe(0);
      expect(truncated.getMilliseconds()).toBe(0);
    });

    it('debería manejar minutos = 0', () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      const truncated = truncateTimestampTo15Min(date);
      expect(truncated.getMinutes()).toBe(0);
    });

    it('debería manejar minutos = 45', () => {
      const date = new Date('2024-01-15T10:45:59.999Z');
      const truncated = truncateTimestampTo15Min(date);
      expect(truncated.getMinutes()).toBe(45);
    });
  });
});
