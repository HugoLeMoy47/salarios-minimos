/**
 * Configuración de NextAuth.js para autenticación OAuth
 */

import { NextAuthOptions, Session } from 'next-auth';
import type { Provider } from 'next-auth/providers/index';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import AppleProvider from 'next-auth/providers/apple';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';

export type AuthEnv = Record<string, string | undefined>;

function hasValue(value?: string): boolean {
  return Boolean(value && value.trim().length > 0);
}

export function hasConfiguredAuthProviders(env: AuthEnv = process.env): boolean {
  return [
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.MICROSOFT_CLIENT_ID,
    env.MICROSOFT_CLIENT_SECRET,
    env.APPLE_ID,
    env.APPLE_TEAM_ID,
    env.APPLE_KEY_ID,
    env.APPLE_PRIVATE_KEY,
  ].some(hasValue);
}

export function getConfiguredAuthProviders(env: AuthEnv = process.env) {
  const providers: Provider[] = [];

  if (hasValue(env.GOOGLE_CLIENT_ID) && hasValue(env.GOOGLE_CLIENT_SECRET)) {
    providers.push(
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID || '',
        clientSecret: env.GOOGLE_CLIENT_SECRET || '',
        allowDangerousEmailAccountLinking: true,
      })
    );
  }

  if (hasValue(env.MICROSOFT_CLIENT_ID) && hasValue(env.MICROSOFT_CLIENT_SECRET)) {
    providers.push(
      AzureADProvider({
        clientId: env.MICROSOFT_CLIENT_ID || '',
        clientSecret: env.MICROSOFT_CLIENT_SECRET || '',
        tenantId: 'common',
        allowDangerousEmailAccountLinking: true,
      })
    );
  }

  if (
    hasValue(env.APPLE_ID) &&
    hasValue(env.APPLE_TEAM_ID) &&
    hasValue(env.APPLE_KEY_ID) &&
    hasValue(env.APPLE_PRIVATE_KEY)
  ) {
    providers.push(
      AppleProvider({
        clientId: env.APPLE_ID || '',
        clientSecret: {
          teamId: env.APPLE_TEAM_ID || '',
          keyId: env.APPLE_KEY_ID || '',
          key: env.APPLE_PRIVATE_KEY || '',
        } as unknown as string,
        allowDangerousEmailAccountLinking: true,
      })
    );
  }

  return providers;
}

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
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: getConfiguredAuthProviders(),
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
      const { logger } = await import('./logger');
      logger.info(`Usuario ${user.email} inició sesión con ${account?.provider}`);
    },
  },
};
