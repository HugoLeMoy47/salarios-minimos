import { signIn } from 'next-auth/react';
import { getProviders } from 'next-auth/react';

export const dynamic = 'force-dynamic';

interface ProviderType {
  id: string;
  name: string;
}

export default async function SignInPage() {
  const providers: Record<string, ProviderType> | null = await getProviders();

  if (!providers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600">No se pudieron cargar los proveedores de autenticación.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">💰 Días de Salario</h1>
          <p className="text-gray-600">Inicia sesión para sincronizar tus datos</p>
        </div>

        <div className="space-y-3">
          {Object.values(providers).map((provider: ProviderType) => (
            <div key={provider.name} className="mb-4">
              <SignInButton provider={provider.id} providerName={provider.name} />
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Tus datos se guardan localmente. Inicia sesión para sincronizarlos y acceder desde
            cualquier dispositivo.
          </p>
        </div>
      </div>
    </div>
  );
}

type SignInButtonProps = {
  provider: string;
  providerName: string;
};

function SignInButton({ provider, providerName }: SignInButtonProps) {
  const getIcon = (providerName: string): string => {
    switch (providerName.toLowerCase()) {
      case 'google':
        return '🔵';
      case 'microsoft':
        return '⚪';
      case 'apple':
        return '🍎';
      default:
        return '👤';
    }
  };

  return (
    <form
      action={async () => {
        'use server';
        await signIn(provider, { redirectTo: '/' });
      }}
    >
      <button
        type="submit"
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-sm hover:shadow-md"
      >
        {getIcon(providerName)} Iniciar sesión con {providerName}
      </button>
    </form>
  );
}
