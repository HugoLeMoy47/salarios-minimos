/**
 * Tests para shadow profile
 */

import { generateUUID, LocalItem } from '@/lib/shadow-profile';

describe('Shadow Profile Utilities', () => {
  describe('generateUUID', () => {
    it('debería generar UUID con formato correcto', () => {
      const uuid = generateUUID();
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidPattern);
    });

    it('debería generar UUIDs únicos', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });

    it('debería generar UUIDs de la longitud correcta', () => {
      const uuid = generateUUID();
      expect(uuid.length).toBe(36); // xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    });
  });

  describe('LocalItem', () => {
    it('debería tener los campos necesarios', () => {
      const item: LocalItem = {
        id: 'test-id',
        price: 500,
        description: 'Test item',
        notes: 'Test notes',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(item.id).toBeDefined();
      expect(item.price).toBe(500);
      expect(item.description).toBe('Test item');
      expect(item.status).toBe('pending');
    });

    it('debería permitir campos opcionales', () => {
      const item: LocalItem = {
        id: 'test-id',
        price: 500,
        description: 'Test item',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(item.notes).toBeUndefined();
      expect(item.photoUrl).toBeUndefined();
    });
  });

  describe('Status values', () => {
    it('debería permitir status válidos', () => {
      const validStatuses: Array<'pending' | 'purchased' | 'not_purchased'> = [
        'pending',
        'purchased',
        'not_purchased',
      ];

      validStatuses.forEach((status) => {
        const item: LocalItem = {
          id: 'test-id',
          price: 500,
          description: 'Test item',
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        expect(item.status).toBe(status);
      });
    });
  });
});
