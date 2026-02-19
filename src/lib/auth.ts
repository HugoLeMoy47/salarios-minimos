/**
 * Configuración de NextAuth.js para autenticación OAuth
 */

import { NextAuthOptions, Session } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import AppleProvider from 'next-auth/providers/apple';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

interface JWTToken {
  sub?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface AppleClientSecret {
  teamId: string;
  keyId: string;
  key: string;
}

// Validar requeridos env vars en build time
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string): string | undefined {
  return process.env[key];
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: getOptionalEnv('GOOGLE_CLIENT_ID') || '',
      clientSecret: getOptionalEnv('GOOGLE_CLIENT_SECRET') || '',
      allowDangerousEmailAccountLinking: true,
    }),
    AzureADProvider({
      clientId: getOptionalEnv('MICROSOFT_CLIENT_ID') || '',
      clientSecret: getOptionalEnv('MICROSOFT_CLIENT_SECRET') || '',
      tenantId: 'common',
      allowDangerousEmailAccountLinking: true,
    }),
    AppleProvider({
      clientId: getOptionalEnv('APPLE_ID') || '',
      clientSecret: {
        teamId: getOptionalEnv('APPLE_TEAM_ID') || '',
        keyId: getOptionalEnv('APPLE_KEY_ID') || '',
        key: getOptionalEnv('APPLE_PRIVATE_KEY') || '',
      } as unknown as string,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, token }: { session: Session; token: JWTToken }) {
      if (session.user) {
        session.user.id = token.sub || '';
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  events: {
    async signIn({ user, account }) {
      console.log(`Usuario ${user.email} inició sesión con ${account?.provider}`);
    },
  },
};
