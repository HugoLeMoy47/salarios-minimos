import { retry } from '@/lib/retry';

describe('retry helper', () => {
  it('should return value when fn succeeds immediately', async () => {
    const result = await retry(() => Promise.resolve(42));
    expect(result).toBe(42);
  });

  it('should retry the specified number of times before failing', async () => {
    let attempts = 0;
    const failingFn = () => {
      attempts += 1;
      return Promise.reject(new Error('boom'));
    };

    await expect(retry(failingFn, { retries: 2, delayMs: 1 })).rejects.toThrow('boom');
    expect(attempts).toBe(3); // initial + 2 retries
  });

  it('should succeed if fn eventually resolves', async () => {
    let attempts = 0;
    const flaky = () => {
      attempts += 1;
      if (attempts < 2) {
        return Promise.reject(new Error('temporary'));
      }
      return Promise.resolve('ok');
    };

    const result = await retry(flaky, { retries: 3, delayMs: 1 });
    expect(result).toBe('ok');
  });
});