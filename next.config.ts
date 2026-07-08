import type { NextConfig } from "next";

// Validación temprana de variables de entorno
import { env } from "./src/lib/env";

// CSP: 'unsafe-inline' en style-src es requerido por MUI/Emotion (estilos inline).
// 'unsafe-inline' en script-src es requerido por los scripts de hidratación de Next.js
// mientras no se implemente un pipeline de nonces.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
];

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_MIN_SALARY_DAILY: String(env.NEXT_PUBLIC_MIN_SALARY_DAILY),
    NEXT_PUBLIC_APP_NAME: env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
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
