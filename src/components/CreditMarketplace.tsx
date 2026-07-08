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
    icon: <FlashIcon sx={{ fontSize: 40, color: 'primary.main' }} aria-hidden="true" />,
    baseRate: 15,
    category: 'microcredit',
  },
  {
    id: 'yotepresto',
    name: 'Préstamo Personal',
    provider: 'YoTePresto',
    description: 'Tasa preferencial por tu bajo nivel de impulsividad',
    icon: <LoanIcon sx={{ fontSize: 40, color: 'success.main' }} aria-hidden="true" />,
    baseRate: 25,
    category: 'personal_loan',
  },
  {
    id: 'nu_stori',
    name: 'Tarjeta de Crédito',
    provider: 'Nu / Stori',
    description: 'Construye tu historial con tu huella de responsabilidad',
    icon: <CreditCardIcon sx={{ fontSize: 40, color: 'error.main' }} aria-hidden="true" />,
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
    <Box component="section" aria-label="Ofertas de crédito" sx={{ mt: 6 }}>
      <Typography variant="h5" component="h2" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
        Ofertas para tu Salud Financiera
      </Typography>

      {isPreferredUser && (
        <Chip
          label="Usuario Preferente"
          sx={{
            bgcolor: 'success.main',
            color: 'success.contrastText',
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
                  border: '1px solid',
                  borderColor: 'divider',
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
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mt: 2, color: 'text.primary' }}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    {product.provider}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary', mb: 2 }}>
                    {product.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Tasa aproximada
                    </Typography>
                    <Typography variant="h5" component="p" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {rate.toFixed(1)}%
                    </Typography>
                    {isPreferredUser && (
                      <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                        -20% por responsabilidad
                      </Typography>
                    )}
                  </Box>

                  {isLocked && (
                    <Typography
                      variant="caption"
                      sx={{ color: 'error.main', fontWeight: 600, mb: 2, display: 'block' }}
                    >
                      En evaluación - Mejora tu score cancelando compras impulsivas
                    </Typography>
                  )}

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => handleProductClick(product)}
                    disabled={isLocked}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    {isLocked ? 'En Evaluación' : 'Solicitar Información'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
          Nuestra app es gratuita porque tu responsabilidad es nuestro activo. Ayudamos a las financieras a encontrarte.
        </Typography>
      </Box>

      {/* Diálogo de Conversión */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'text.primary' }}>
          ¡Felicidades, {userName}!
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Al demostrar que controlas tus impulsos, hemos enviado tu &apos;Score de Meditación&apos; a las financieras asociadas.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Estás un paso más cerca de un crédito justo basado en tu responsabilidad financiera real.
          </Typography>
          {selectedProduct && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
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
