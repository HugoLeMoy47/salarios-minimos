import type { NextConfig } from "next";

// Validación temprana de variables de entorno
import { env } from "./src/lib/env";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_MIN_SALARY_DAILY: String(env.NEXT_PUBLIC_MIN_SALARY_DAILY),
    NEXT_PUBLIC_APP_NAME: env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
  },
  // El cliente generado por Prisma 7 usa imports ESM con extensión ".js"
  // que apuntan a archivos ".ts" (src/generated/prisma). Turbopack (default
  // en Next 16) no resuelve este mapeo; por eso el proyecto compila con
  // webpack explícitamente (ver scripts "dev"/"build" en package.json).
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default nextConfig;
