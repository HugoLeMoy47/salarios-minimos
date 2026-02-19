'use client';

import React, { useState } from 'react';
import {
  calculateSalaryDays,
  getSalaryDaysExplanation,
  getMinimumSalaryDaily,
  getSalaryDaysBucket,
} from '@/lib/salary-calculator';
import { addItemToShadowProfile, LocalItem } from '@/lib/shadow-profile';
import {
  requestGeolocation,
  coordinatesToGeohash6,
  truncateTimestampTo15Min,
} from '@/lib/geolocation';

interface ItemFormProps {
  onItemCreated: (item: LocalItem) => void;
  onError: (error: string) => void;
}

export function ItemForm({ onItemCreated, onError }: ItemFormProps) {
  const [formData, setFormData] = useState({
    description: '',
    price: '',
    notes: '',
    photoUrl: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [salaryDays, setSalaryDays] = useState<number | null>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);

  const minimumSalary = getMinimumSalaryDaily();

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = e.target.value;
    setFormData({ ...formData, price });

    if (price) {
      const days = calculateSalaryDays(parseFloat(price));
      setSalaryDays(days);
    } else {
      setSalaryDays(null);
    }
  };

  const handleRequestLocation = async () => {
    setRequestingLocation(true);
    try {
      const location = await requestGeolocation();
      if (location) {
        const geohash = coordinatesToGeohash6(location.latitude, location.longitude);
        console.log('Ubicación capturada:', {
          geohash,
          latitude: location.latitude,
          longitude: location.longitude,
        });
        // Location captured, will be used in form submission
      } else {
        onError('No se pudo obtener la ubicación');
      }
    } catch {
      onError('Error al solicitar ubicación');
    } finally {
      setRequestingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.description || !formData.price) {
        throw new Error('Descripción y precio son requeridos');
      }

      // Obtener ubicación si está disponible
      let latitude, longitude, geohash;
      try {
        const location = await requestGeolocation();
        if (location) {
          latitude = location.latitude;
          longitude = location.longitude;
          geohash = coordinatesToGeohash6(latitude, longitude);
        }
      } catch {
        // Continuar sin ubicación
      }

      // Crear item en shadow profile local
      const newItem = await addItemToShadowProfile({
        price: parseFloat(formData.price),
        description: formData.description,
        notes: formData.notes || undefined,
        photoUrl: formData.photoUrl || undefined,
        latitude,
        longitude,
        geohash,
        status: 'pending',
      });

      // Enviar evento anonimizado
      try {
        const bucket = getSalaryDaysBucket(calculateSalaryDays(parseFloat(formData.price)));
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'item_created',
            salaryDaysBucket: bucket,
            geohash6: geohash ? geohash.substring(0, 6) : null,
            timestamp15min: truncateTimestampTo15Min(),
          }),
        });
      } catch {
        // Ignorar errores al enviar eventos
      }

      onItemCreated(newItem);
      setFormData({ description: '', price: '', notes: '', photoUrl: '' });
      setSalaryDays(null);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Error al crear item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">¿Qué quieres comprar?</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción del artículo *
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Ej: Laptop, zapatillas, viaje a playa..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Precio (MXN) *</label>
        <input
          type="number"
          step="0.01"
          value={formData.price}
          onChange={handlePriceChange}
          placeholder="0.00"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      {salaryDays !== null && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm font-semibold text-blue-900">
            {getSalaryDaysExplanation(parseFloat(formData.price))}
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Basado en salario mínimo: ${minimumSalary}/día
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Ej: Necesito guardar para octubre..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:bg-gray-400"
        >
          {isLoading ? 'Creando...' : 'Crear artículo'}
        </button>
        <button
          type="button"
          onClick={handleRequestLocation}
          disabled={requestingLocation || isLoading}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md disabled:bg-gray-400"
          title="Compartir ubicación (opcional)"
        >
          📍
        </button>
      </div>

      <p className="text-xs text-gray-500">
        * Campos requeridos. Tu ubicación es opcional y será anonimizada.
      </p>
    </form>
  );
}
