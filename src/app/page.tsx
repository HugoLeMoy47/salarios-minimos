'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { ItemForm } from '@/components/ItemForm';
import { LocalItem, getAllShadowItems } from '@/lib/shadow-profile';

export default function Home() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<LocalItem[]>([]);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pendientes' | 'compradas' | 'no_compradas'>(
    'pendientes'
  );

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const shadowItems = await getAllShadowItems();
        setItems(shadowItems);
      } catch (err) {
        console.error('Error cargando items:', err);
      }
    };

    fetchItems();
  }, []);

  const handleItemCreated = async (newItem: LocalItem) => {
    setItems([...items, newItem]);
    setError('');
  };

  const handleItemStatusChange = async (
    itemId: string,
    newStatus: 'purchased' | 'not_purchased'
  ) => {
    setItems(items.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item)));
  };

  const getFilteredItems = () => {
    const statusMap: Record<string, 'pending' | 'purchased' | 'not_purchased'> = {
      pendientes: 'pending',
      compradas: 'purchased',
      no_compradas: 'not_purchased',
    };
    return items.filter((item) => item.status === statusMap[activeTab]);
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💰 Días de Salario</h1>
            <p className="text-sm text-gray-600">¿Cuántos días de trabajo cuesta?</p>
          </div>
          <div className="flex items-center gap-4">
            {status === 'loading' && <div className="text-sm text-gray-600">Cargando...</div>}
            {session ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                  <p className="text-xs text-gray-500">Autenticado</p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition"
              >
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Formulario */}
        <div className="mb-8">
          <ItemForm onItemCreated={handleItemCreated} onError={setError} />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <p className="font-medium">Error: {error}</p>
          </div>
        )}

        {/* Tabs para filtros */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex gap-4 mb-6 border-b">
            <button
              onClick={() => setActiveTab('pendientes')}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === 'pendientes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              ⏳ Pendientes ({items.filter((i) => i.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('compradas')}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === 'compradas'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              ✅ Compradas ({items.filter((i) => i.status === 'purchased').length})
            </button>
            <button
              onClick={() => setActiveTab('no_compradas')}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === 'no_compradas'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              ❌ No compradas ({items.filter((i) => i.status === 'not_purchased').length})
            </button>
          </div>

          {/* Lista de items */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-2">
                {activeTab === 'pendientes' && '¡Agrega un artículo para comenzar!'}
                {activeTab === 'compradas' && 'Sin artículos comprados aún.'}
                {activeTab === 'no_compradas' && 'Sin artículos descartados aún.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{item.description}</h3>
                      {item.notes && <p className="text-sm text-gray-600 mt-1">📝 {item.notes}</p>}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xl font-bold text-blue-600">${item.price.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">
                        {Math.round((item.price / 241.56) * 10) / 10} días
                      </p>
                    </div>
                  </div>

                  {activeTab === 'pendientes' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleItemStatusChange(item.id, 'purchased')}
                        className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition"
                      >
                        ✅ Lo compré
                      </button>
                      <button
                        onClick={() => handleItemStatusChange(item.id, 'not_purchased')}
                        className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition"
                      >
                        ❌ No lo compré
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    📅 {new Date(item.createdAt).toLocaleDateString('es-MX')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info de shadow profile */}
        {!session && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Datos locales</h3>
            <p className="text-sm text-blue-800 mb-2">
              Tus datos se guardan localmente en tu navegador. Si inicias sesión, podremos fusionar
              tu historial.
            </p>
            <button
              onClick={() => signIn()}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
            >
              Iniciar sesión para sincronizar
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>MVP &ldquo;Días de Salario&rdquo; © 2026 • Privacidad · Ayuda · Contacto</p>
        </div>
      </footer>
    </div>
  );
}
