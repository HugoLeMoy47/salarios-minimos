/**
 * Cálculo de días de salario y utilidades relacionadas
 */

const MIN_SALARY_DAILY = parseFloat(process.env.NEXT_PUBLIC_MIN_SALARY_DAILY || '241.56');

/**
 * Calcular días de salario requeridos para comprar un artículo
 * @param price Precio en MXN
 * @param salaryDaily Salario diario (por defecto el mínimo)
 * @returns Días requeridos con 1 decimal
 */
export function calculateSalaryDays(price: number, salaryDaily: number = MIN_SALARY_DAILY): number {
  if (price <= 0 || salaryDaily <= 0) return 0;
  return Math.round((price / salaryDaily) * 10) / 10;
}

/**
 * Obtener el salario mínimo diario configurado
 */
export function getMinimumSalaryDaily(): number {
  return MIN_SALARY_DAILY;
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
 * Obtener explicación del cálculo de días de salario
 */
export function getSalaryDaysExplanation(
  price: number,
  salaryDaily: number = MIN_SALARY_DAILY
): string {
  const days = calculateSalaryDays(price, salaryDaily);
  return `${formatSalaryDays(days)} de salario mínimo (${price} MXN ÷ ${salaryDaily} MXN/día)`;
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
