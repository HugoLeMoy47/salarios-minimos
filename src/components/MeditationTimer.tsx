'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { visuallyHidden } from '@mui/utils';

interface MeditationTimerProps {
  startedAt: string; // ISO string
  onComplete?: () => void;
}

const MEDITATION_DURATION_MS = 72 * 60 * 60 * 1000; // 72 hours in milliseconds

export function MeditationTimer({ startedAt, onComplete }: MeditationTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  // Anuncio para lectores de pantalla: se actualiza solo en hitos (cada hora y al
  // completar), no cada segundo — anunciar cada tick sería ruido inutilizable.
  const [announcement, setAnnouncement] = useState<string>('');

  useEffect(() => {
    const startedTime = new Date(startedAt).getTime();
    const endTime = startedTime + MEDITATION_DURATION_MS;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);

      setTimeLeft(remaining);

      const elapsed = MEDITATION_DURATION_MS - remaining;
      setProgress((elapsed / MEDITATION_DURATION_MS) * 100);

      if (remaining <= 0) {
        setAnnouncement('Meditación completada. La compra está desbloqueada.');
        if (onComplete) onComplete();
      } else {
        // Solo cambia una vez por hora → un anuncio por hora.
        const hoursLeft = Math.ceil(remaining / (1000 * 60 * 60));
        setAnnouncement(`Quedan aproximadamente ${hoursLeft} horas de meditación.`);
      }
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, [startedAt, onComplete]);

  const formatTime = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const isComplete = timeLeft <= 0;

  return (
    <Box sx={{ width: '100%', mt: 1 }}>
      {/* Región viva para lectores de pantalla: solo cambia en hitos. */}
      <Box component="span" sx={visuallyHidden} aria-live="polite" aria-atomic="true">
        {announcement}
      </Box>

      {!isComplete ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }} aria-hidden="true">
            Tiempo restante: {formatTime(timeLeft)}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            color="primary"
            aria-label="Progreso del período de meditación"
            sx={{ height: 8, borderRadius: 4 }}
          />
        </>
      ) : (
        <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
          ✅ Meditación completada
        </Typography>
      )}
    </Box>
  );
}
