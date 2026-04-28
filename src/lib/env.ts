import { z } from 'zod';

// Esquema de variables de entorno necesarias para la aplicación.
// Se puede ampliar según se añadan más variables.
export const EnvSchema = z.object({
  DATABASE_URL: z.string().nonempty(),
  NEXTAUTH_SECRET: z.string().nonempty(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  APPLE_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),

  NEXT_PUBLIC_MIN_SALARY_DAILY: z.string().transform((val) => Number(val)),
  NEXT_PUBLIC_APP_NAME: z.string().nonempty(),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  ENCRYPTION_KEY: z.string().nonempty(),
});

// Se expone un objeto validado con todos los valores transformados en el tipo correcto
let envData: z.infer<typeof EnvSchema>;

const result = EnvSchema.safeParse(process.env);
if (result.success) {
  envData = result.data;
} else {
  if (process.env.NODE_ENV === 'test') {
    // En tests no necesitamos que todas las variables existan; exportamos un stub vacío
    // para que las pruebas puedan usar EnvSchema directamente si lo desean.
     
    console.warn('Env validation failed in test mode:', result.error);
     
    envData = {} as z.infer<typeof EnvSchema>;
  } else {
    throw result.error;
  }
}

export const env = envData;

export type Env = z.infer<typeof EnvSchema>;
