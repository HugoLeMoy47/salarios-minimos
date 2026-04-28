'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

interface MeditationTimerProps {
  startedAt: string; // ISO string
  onComplete?: () => void;
}

const MEDITATION_DURATION_MS = 72 * 60 * 60 * 1000; // 72 hours in milliseconds

export function MeditationTimer({ startedAt, onComplete }: MeditationTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const startedTime = new Date(startedAt).getTime();
    const endTime = startedTime + MEDITATION_DURATION_MS;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);

      setTimeLeft(remaining);

      const elapsed = MEDITATION_DURATION_MS - remaining;
      setProgress((elapsed / MEDITATION_DURATION_MS) * 100);

      if (remaining <= 0 && onComplete) {
        onComplete();
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
      {!isComplete ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Tiempo restante: {formatTime(timeLeft)}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#1976d2',
              },
            }}
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