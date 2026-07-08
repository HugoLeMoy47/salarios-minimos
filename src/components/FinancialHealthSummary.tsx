'use client';

import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Alert } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { LocalItem } from '@/lib/shadow-profile';
import {
  calculateSalaryDays,
  calculateIncomePercentage,
  calculateTotalLifeRecovered,
  type SalaryZone,
} from '@/lib/salary-calculator';

interface FinancialHealthSummaryProps {
  items: LocalItem[];
  userConfig: { zone?: SalaryZone; monthlyIncome?: number };
  victoryMessage?: { show: boolean; days: number };
}

export function FinancialHealthSummary({ items, userConfig, victoryMessage }: FinancialHealthSummaryProps) {
  const zone = userConfig.zone || 'general';
  const monthlyIncome = userConfig.monthlyIncome || 0;

  // Calcular indicadores
  const purchasedItems = items.filter(item => item.status === 'purchased');
  const meditatingItems = items.filter(item => item.status === 'meditating');
  const cancelledItems = items.filter(item => item.status === 'cancelled');

  const totalPurchasedAmount = purchasedItems.reduce((sum, item) => sum + item.price, 0);
  const totalMeditatingAmount = meditatingItems.reduce((sum, item) => sum + item.price, 0);

  const lifeCommittedDays = calculateSalaryDays(totalPurchasedAmount, zone);
  const evaluationPercentage = monthlyIncome > 0 ? calculateIncomePercentage(totalMeditatingAmount, monthlyIncome) : 0;
  const lifeRecoveredDays = calculateTotalLifeRecovered(cancelledItems.map(item => item.price), zone);

  // Nudge: Mostrar mensaje si evaluación > 30%
  const showWarning = evaluationPercentage > 30;

  return (
    <Box component="section" aria-label="Resumen de salud financiera" sx={{ mb: 4 }}>
      {victoryMessage?.show && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ¡Felicidades! Has recuperado {victoryMessage.days} días de tu vida al cancelar esa compra.
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Vida Comprometida */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                Vida Comprometida
              </Typography>
              <Typography variant="h4" component="p" sx={{ fontWeight: 700, color: 'error.main', mb: 0.5 }}>
                {lifeCommittedDays.toFixed(1)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                días de esfuerzo invertidos en compras
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Esfuerzo en Evaluación */}
        <Grid item xs={12} sm={4}>
          <Card
            sx={(theme) => ({
              height: '100%',
              border: '1px solid',
              borderColor: showWarning ? 'warning.main' : 'divider',
              bgcolor: showWarning ? alpha(theme.palette.warning.main, 0.12) : 'background.paper',
            })}
          >
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                Esfuerzo en Evaluación
              </Typography>
              <Typography
                variant="h4"
                component="p"
                sx={{ fontWeight: 700, color: showWarning ? 'warning.main' : 'primary.main', mb: 0.5 }}
              >
                {evaluationPercentage.toFixed(1)}%
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                de tu ingreso mensual en meditación
              </Typography>
              {showWarning && (
                <Typography
                  variant="caption"
                  sx={{ color: 'warning.main', fontWeight: 600, mt: 1, display: 'block' }}
                >
                  ¡Cuidado! Estás evaluando comprometer casi un tercio de tu mes laboral.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Vida Recuperada */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                Vida Recuperada
              </Typography>
              <Typography variant="h4" component="p" sx={{ fontWeight: 700, color: 'success.main', mb: 0.5 }}>
                {lifeRecoveredDays.toFixed(1)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                días de descanso/vida recuperados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
