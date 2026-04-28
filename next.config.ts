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
};

export default nextConfig;
