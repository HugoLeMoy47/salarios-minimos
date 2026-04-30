'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  AccountBalance as LoanIcon,
  Bolt as FlashIcon,
} from '@mui/icons-material';
import { LocalItem } from '@/lib/shadow-profile';
import { calculateTotalLifeRecovered, type SalaryZone } from '@/lib/salary-calculator';

interface CreditMarketplaceProps {
  items: LocalItem[];
  userConfig: { zone?: SalaryZone; monthlyIncome?: number };
  userName?: string;
}

interface Product {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: React.ReactNode;
  baseRate: number; // Tasa base en %
  category: 'microcredit' | 'personal_loan' | 'credit_card';
}

const PRODUCTS: Product[] = [
  {
    id: 'kueski_pay',
    name: 'Microcrédito Express',
    provider: 'Kueski Pay',
    description: 'Ideal para emergencias menores',
    icon: <FlashIcon sx={{ fontSize: 40, color: '#0078d4' }} />,
    baseRate: 15,
    category: 'microcredit',
  },
  {
    id: 'yotepresto',
    name: 'Préstamo Personal',
    provider: 'YoTePresto',
    description: 'Tasa preferencial por tu bajo nivel de impulsividad',
    icon: <LoanIcon sx={{ fontSize: 40, color: '#107c10' }} />,
    baseRate: 25,
    category: 'personal_loan',
  },
  {
    id: 'nu_stori',
    name: 'Tarjeta de Crédito',
    provider: 'Nu / Stori',
    description: 'Construye tu historial con tu huella de responsabilidad',
    icon: <CreditCardIcon sx={{ fontSize: 40, color: '#d13438' }} />,
    baseRate: 35,
    category: 'credit_card',
  },
];

export function CreditMarketplace({ items, userConfig, userName = 'Usuario' }: CreditMarketplaceProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const zone = userConfig.zone || 'general';
  const cancelledItems = items.filter(item => item.status === 'cancelled');
  const recoveredDays = calculateTotalLifeRecovered(cancelledItems.map(item => item.price), zone);
  const isPreferredUser = recoveredDays > 1;

  const getProductRate = (baseRate: number) => {
    return isPreferredUser ? baseRate * 0.8 : baseRate;
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setDialogOpen(true);

    // Registrar conversión
    console.log('Conversión registrada:', {
      productId: product.id,
      userName,
      recoveredDays,
      timestamp: new Date().toISOString(),
      eventType: 'marketplace_conversion',
    });

    // Aquí podrías actualizar ShadowProfile si quisieras persistir
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedProduct(null);
  };

  return (
    <Box sx={{ mt: 6 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#323130', mb: 2 }}>
        Ofertas para tu Salud Financiera
      </Typography>

      {isPreferredUser && (
        <Chip
          label="Usuario Preferente"
          sx={{
            bgcolor: '#107c10',
            color: 'white',
            fontWeight: 600,
            mb: 2,
            '& .MuiChip-label': { px: 2 },
          }}
        />
      )}

      <Grid container spacing={3}>
        {PRODUCTS.map((product) => {
          const rate = getProductRate(product.baseRate);
          const isLocked = !isPreferredUser;

          return (
            <Grid item xs={12} md={4} key={product.id}>
              <Card
                sx={{
                  height: '100%',
                  border: '1px solid #e1dfdd',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)',
                  },
                  opacity: isLocked ? 0.7 : 1,
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  {product.icon}
                  <Typography variant="h6" sx={{ fontWeight: 600, mt: 2, color: '#323130' }}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#605e5c', mb: 1 }}>
                    {product.provider}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#323130', mb: 2 }}>
                    {product.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#605e5c' }}>
                      Tasa aproximada
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#0078d4' }}>
                      {rate.toFixed(1)}%
                    </Typography>
                    {isPreferredUser && (
                      <Typography variant="caption" sx={{ color: '#107c10', fontWeight: 600 }}>
                        -20% por responsabilidad
                      </Typography>
                    )}
                  </Box>

                  {isLocked && (
                    <Typography variant="caption" sx={{ color: '#d13438', fontWeight: 600, mb: 2, display: 'block' }}>
                      En evaluación - Mejora tu score cancelando compras impulsivas
                    </Typography>
                  )}

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleProductClick(product)}
                    disabled={isLocked}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      bgcolor: isLocked ? '#e0e0e0' : '#0078d4',
                      '&:hover': {
                        bgcolor: isLocked ? '#e0e0e0' : '#005a9e',
                      },
                    }}
                  >
                    {isLocked ? 'En Evaluación' : 'Solicitar Información'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Divider sx={{ my: 4, borderColor: '#e1dfdd' }} />

      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body2" sx={{ color: '#605e5c', fontStyle: 'italic' }}>
          Nuestra app es gratuita porque tu responsabilidad es nuestro activo. Ayudamos a las financieras a encontrarte.
        </Typography>
      </Box>

      {/* Diálogo de Conversión */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#323130' }}>
          ¡Felicidades, {userName}!
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Al demostrar que controlas tus impulsos, hemos enviado tu 'Score de Meditación' a las financieras asociadas.
          </Typography>
          <Typography variant="body2" sx={{ color: '#605e5c' }}>
            Estás un paso más cerca de un crédito justo basado en tu responsabilidad financiera real.
          </Typography>
          {selectedProduct && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f3f2f1', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Producto solicitado: {selectedProduct.name} ({selectedProduct.provider})
              </Typography>
              <Typography variant="caption">
                Tasa preferencial: {getProductRate(selectedProduct.baseRate).toFixed(1)}%
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} variant="contained" sx={{ textTransform: 'none' }}>
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}