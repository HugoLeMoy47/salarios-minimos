'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Button,
  Paper,
  Alert,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { updateUserConfig, getUserConfig } from '@/lib/shadow-profile';
import { getMinimumSalaryDaily } from '@/lib/salary-calculator';

export default function OnboardingPage() {
  const router = useRouter();
  const [zone, setZone] = useState<'general' | 'frontera'>('general');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Cargar configuración existente si hay
    const loadConfig = async () => {
      try {
        const config = await getUserConfig();
        if (config.zone) setZone(config.zone);
        if (config.monthlyIncome) setMonthlyIncome(config.monthlyIncome.toString());
      } catch (err) {
        console.error('Error cargando configuración:', err);
      }
    };
    loadConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const income = parseFloat(monthlyIncome);
      if (isNaN(income) || income <= 0) {
        throw new Error('Ingresa un ingreso mensual válido');
      }

      await updateUserConfig({ zone, monthlyIncome: income });
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const salaryDaily = getMinimumSalaryDaily(zone);
  const incomeNum = parseFloat(monthlyIncome) || 0;
  const exampleDays = incomeNum > 0 ? Math.round((incomeNum / salaryDaily) / 30 * 10) / 10 : 0;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          💰 Configuración Inicial
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Personaliza tu experiencia configurando tu zona y ingreso mensual
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
              Zona de Salario Mínimo
            </FormLabel>
            <RadioGroup
              value={zone}
              onChange={(e) => setZone(e.target.value as 'general' | 'frontera')}
            >
              <FormControlLabel
                value="general"
                control={<Radio />}
                label={`Zona General - ${getMinimumSalaryDaily('general')} MXN/día`}
              />
              <FormControlLabel
                value="frontera"
                control={<Radio />}
                label={`Zona Libre de la Frontera Norte - ${getMinimumSalaryDaily('frontera')} MXN/día`}
              />
            </RadioGroup>
          </FormControl>

          <TextField
            fullWidth
            label="Ingreso Mensual Neto (MXN)"
            type="number"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            helperText={
              incomeNum > 0
                ? `Equivalente a aproximadamente ${exampleDays} días de salario mínimo al mes`
                : 'Ingresa tu ingreso mensual después de impuestos'
            }
            sx={{ mb: 3 }}
            required
          />

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isLoading}
            sx={{ mt: 2 }}
          >
            {isLoading ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}