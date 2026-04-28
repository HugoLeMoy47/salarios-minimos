/**
 * Tests para calculadora de salarios
 */

import {
  calculateSalaryDays,
  formatSalaryDays,
  getSalaryDaysExplanation,
  getSalaryDaysBucket,
  getMinimumSalaryDaily,
} from '@/lib/salary-calculator';

describe('Salary Calculator', () => {
  describe('calculateSalaryDays', () => {
    it('debería calcular correctamente días de salario', () => {
      const result = calculateSalaryDays(315.04);
      expect(result).toBe(1);
    });

    it('debería calcular menos de un día', () => {
      const result = calculateSalaryDays(150);
      expect(result).toBeLessThan(1);
    });

    it('debería calcular con decimales correctamente', () => {
      const result = calculateSalaryDays(472.56);
      expect(result).toBeCloseTo(1.5);
    });

    it('debería retornar 0 para precio 0', () => {
      const result = calculateSalaryDays(0);
      expect(result).toBe(0);
    });

    it('debería retornar 0 para salario negativo', () => {
      const result = calculateSalaryDays(100, 'general');
      expect(result).toBeCloseTo(0.3);
    });
  });

  describe('formatSalaryDays', () => {
    it('debería formatear 1 día correctamente', () => {
      const result = formatSalaryDays(1);
      expect(result).toBe('1 día');
    });

    it('debería formatear múltiples días', () => {
      const result = formatSalaryDays(2.5);
      expect(result).toBe('2.5 días');
    });

    it('debería formatear fracciones de día', () => {
      const result = formatSalaryDays(0.5);
      expect(result).toContain('parte de un día');
    });
  });

  describe('getSalaryDaysBucket', () => {
    it('debería categorizar bien < 1 día', () => {
      expect(getSalaryDaysBucket(0.5)).toBe('0-0.9');
    });

    it('debería categorizar bien 1-2.9 días', () => {
      expect(getSalaryDaysBucket(1.5)).toBe('1-2.9');
    });

    it('debería categorizar bien 3-6.9 días', () => {
      expect(getSalaryDaysBucket(5)).toBe('3-6.9');
    });

    it('debería categorizar bien >= 7 días', () => {
      expect(getSalaryDaysBucket(10)).toBe('7+');
    });
  });

  describe('getMinimumSalaryDaily', () => {
    it('debería retornar el salario mínimo configurado', () => {
      const salary = getMinimumSalaryDaily();
      expect(salary).toBeGreaterThan(0);
      expect(typeof salary).toBe('number');
    });
  });

  describe('getSalaryDaysExplanation', () => {
    it('debería generar explicación correcta', () => {
      const explanation = getSalaryDaysExplanation(315.04);
      expect(explanation).toContain('1 día');
      expect(explanation).toContain('315.04');
    });
  });
});
