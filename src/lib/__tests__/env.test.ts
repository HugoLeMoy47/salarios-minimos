import { z } from 'zod';
import { EnvSchema } from '@/lib/env';

describe('Environment schema', () => {
  it('should parse valid environment variables', () => {
    const valid = {
      DATABASE_URL: 'postgres://user:pass@localhost/db',
      NEXTAUTH_SECRET: 'secret',
      NEXT_PUBLIC_MIN_SALARY_DAILY: '241.56',
      NEXT_PUBLIC_APP_NAME: 'App',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      ENCRYPTION_KEY: 'abc123',
    } as Record<string, string>;

    const parsed = EnvSchema.parse(valid);
    expect(parsed.DATABASE_URL).toBe(valid.DATABASE_URL);
    expect(parsed.NEXT_PUBLIC_MIN_SALARY_DAILY).toBe(241.56);
  });

  it('should throw if required variable missing', () => {
    expect(() => EnvSchema.parse({})).toThrow(z.ZodError);
  });
});