/**
 * Simple retry helper with exponential backoff.
 * Usar para envolver operaciones externas (Prisma, fetch, etc.).
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delayMs?: number } = {}
): Promise<T> {
  const { retries = 3, delayMs = 100 } = options;
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      attempt += 1;
      if (attempt > retries) break;
      const backoff = delayMs * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastError;
}
