'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    AccessDenied: 'Se denegó el acceso. Por favor intenta de nuevo.',
    Callback: 'Error en el proceso de autenticación.',
    OAuthSignin: 'Error al iniciar sesión con el proveedor.',
    OAuthCallback: 'Error en la devolución de llamada de OAuth.',
    OAuthCreateAccount: 'No se pudo crear la cuenta.',
    EmailCreateAccount: 'No se pudo crear la cuenta con email.',
    OAuthError: 'Error inesperado.',
    EmailSignin: 'Verifica tu correo electrónico.',
    EmailSigninVerify: 'Verifica el enlace en tu correo.',
    CredentialsSignin: 'Credenciales inválidas.',
    SessionCallback: 'Error en la sesión.',
  };

  const message = errorMessages[error as string] || 'Error desconocido al autenticar.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="mb-6">
          <div className="inline-block p-3 bg-red-100 rounded-full mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error de autenticación</h1>
          <p className="text-gray-600">{message}</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Intentar de nuevo
          </Link>
          <Link
            href="/"
            className="block px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="mb-6">
          <div className="inline-block p-3 bg-red-100 rounded-full mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error de autenticación</h1>
          <p className="text-gray-600">Error desconocido al autenticar.</p>
        </div>
        <Link
          href="/"
          className="block px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<ErrorFallback />}>
      <AuthErrorContent />
    </Suspense>
  );
}
