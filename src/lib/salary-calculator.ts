/**
 * Cálculo de días de salario y utilidades relacionadas
 * Valores actualizados para 2026 según decreto oficial
 */

export type SalaryZone = 'general' | 'frontera';

const SALARY_DAILY_2026: Record<SalaryZone, number> = {
  general: 315.04, // Zona General
  frontera: 440.87, // Zona Libre de la Frontera Norte
};

/**
 * Obtener salario mínimo diario por zona
 */
export function getMinimumSalaryDaily(zone: SalaryZone = 'general'): number {
  return SALARY_DAILY_2026[zone];
}

/**
 * Calcular días de salario requeridos para comprar un artículo
 * @param price Precio en MXN
 * @param zone Zona del salario mínimo
 * @returns Días requeridos con 1 decimal
 */
export function calculateSalaryDays(price: number, zone: SalaryZone = 'general'): number {
  const salaryDaily = getMinimumSalaryDaily(zone);
  if (price <= 0 || salaryDaily <= 0) return 0;
  return Math.round((price / salaryDaily) * 10) / 10;
}

/**
 * Calcular porcentaje del ingreso mensual que representa un gasto
 * @param price Precio en MXN
 * @param monthlyIncome Ingreso mensual neto en MXN
 * @returns Porcentaje con 1 decimal
 */
export function calculateIncomePercentage(price: number, monthlyIncome: number): number {
  if (price <= 0 || monthlyIncome <= 0) return 0;
  return Math.round((price / monthlyIncome) * 1000) / 10;
}

/**
 * Formatear días de salario con contexto
 */
export function formatSalaryDays(days: number): string {
  if (days === 1) return '1 día';
  if (days < 1) return `${Math.round(days * 10) / 10} parte de un día`;
  return `${days} días`;
}

/**
 * Formatear porcentaje de ingreso
 */
export function formatIncomePercentage(percentage: number): string {
  return `${percentage}%`;
}

/**
 * Obtener explicación del cálculo de días de salario
 */
export function getSalaryDaysExplanation(
  price: number,
  zone: SalaryZone = 'general',
  monthlyIncome?: number
): string {
  const days = calculateSalaryDays(price, zone);
  const salaryDaily = getMinimumSalaryDaily(zone);
  let explanation = `${formatSalaryDays(days)} de salario mínimo (${price} MXN ÷ ${salaryDaily} MXN/día)`;

  if (monthlyIncome) {
    const percentage = calculateIncomePercentage(price, monthlyIncome);
    explanation += `, equivalente al ${formatIncomePercentage(percentage)} de tu ingreso mensual`;
  }

  return explanation;
}

/**
 * Convertir días de salario a categoría de presupuesto
 */
export function getSalaryDaysBucket(days: number): string {
  if (days < 1) return '0-0.9';
  if (days < 3) return '1-2.9';
  if (days < 7) return '3-6.9';
  return '7+';
}
