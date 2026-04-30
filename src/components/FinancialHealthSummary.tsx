'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Grid, Alert } from '@mui/material';
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
  const totalCancelledAmount = cancelledItems.reduce((sum, item) => sum + item.price, 0);

  const lifeCommittedDays = calculateSalaryDays(totalPurchasedAmount, zone);
  const evaluationPercentage = monthlyIncome > 0 ? calculateIncomePercentage(totalMeditatingAmount, monthlyIncome) : 0;
  const lifeRecoveredDays = calculateTotalLifeRecovered(cancelledItems.map(item => item.price), zone);

  // Nudge: Mostrar mensaje si evaluación > 30%
  const showWarning = evaluationPercentage > 30;

  return (
    <Box sx={{ mb: 4 }}>
      {victoryMessage?.show && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ¡Felicidades! Has recuperado {victoryMessage.days} días de tu vida al cancelar esa compra.
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Vida Comprometida */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%', border: '1px solid #e1dfdd' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#323130', mb: 1 }}>
                Vida Comprometida
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#d13438', mb: 0.5 }}>
                {lifeCommittedDays.toFixed(1)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#605e5c' }}>
                días de esfuerzo invertidos en compras
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Esfuerzo en Evaluación */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%', border: '1px solid #e1dfdd', bgcolor: showWarning ? '#fff3cd' : 'inherit' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#323130', mb: 1 }}>
                Esfuerzo en Evaluación
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: showWarning ? '#856404' : '#0078d4', mb: 0.5 }}>
                {evaluationPercentage.toFixed(1)}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#605e5c' }}>
                de tu ingreso mensual en meditación
              </Typography>
              {showWarning && (
                <Typography variant="caption" sx={{ color: '#856404', fontWeight: 600, mt: 1, display: 'block' }}>
                  ¡Cuidado! Estás evaluando comprometer casi un tercio de tu mes laboral.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Vida Recuperada */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%', border: '1px solid #e1dfdd' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#323130', mb: 1 }}>
                Vida Recuperada
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#107c10', mb: 0.5 }}>
                {lifeRecoveredDays.toFixed(1)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#605e5c' }}>
                días de descanso/vida recuperados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}