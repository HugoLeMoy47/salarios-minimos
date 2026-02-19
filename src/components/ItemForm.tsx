'use client';

import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        ¿Qué quieres comprar?
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Descripción del artículo *"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Ej: Laptop, zapatillas, viaje a playa..."
          required
          fullWidth
          variant="outlined"
        />

        <TextField
          label="Precio (MXN) *"
          type="number"
          inputProps={{ step: '0.01' }}
          value={formData.price}
          onChange={handlePriceChange}
          placeholder="0.00"
          required
          fullWidth
          variant="outlined"
        />

        {salaryDays !== null && (
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {getSalaryDaysExplanation(parseFloat(formData.price))}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Basado en salario mínimo: ${minimumSalary}/día
            </Typography>
          </Box>
        )}

        <TextField
          label="Notas (opcional)"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Ej: Necesito guardar para octubre..."
          fullWidth
          multiline
          rows={3}
          variant="outlined"
        />

        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={isLoading}>
            {isLoading ? 'Creando...' : 'Crear artículo'}
          </Button>
          <Button
            type="button"
            onClick={handleRequestLocation}
            variant="contained"
            color="success"
            disabled={requestingLocation || isLoading}
            title="Compartir ubicación (opcional)"
          >
            📍
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary">
          * Campos requeridos. Tu ubicación es opcional y será anonimizada.
        </Typography>
      </Box>
    </Box>
  );
}
