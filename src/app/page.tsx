'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  Container,
  Box,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
} from '@mui/material';
import Link from 'next/link';
import { ItemForm } from '@/components/ItemForm';
import { MeditationTimer } from '@/components/MeditationTimer';
import { FinancialHealthSummary } from '@/components/FinancialHealthSummary';
import { CreditMarketplace } from '@/components/CreditMarketplace';
import { LocalItem, getAllShadowItems, getUserConfig } from '@/lib/shadow-profile';
import { calculateSalaryDays } from '@/lib/salary-calculator';

export default function Home() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<LocalItem[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'pendientes' | 'meditando' | 'compradas' | 'no_compradas'>(
    'pendientes'
  );
  const [userConfig, setUserConfig] = useState<{ zone?: 'general' | 'frontera'; monthlyIncome?: number }>({});
  const [victoryMessage, setVictoryMessage] = useState<{ show: boolean; days: number }>({ show: false, days: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        const [shadowItems, config] = await Promise.all([getAllShadowItems(), getUserConfig()]);
        setItems(shadowItems);
        setUserConfig(config);
      } catch (err) {
        console.error('Error cargando datos:', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const handleItemCreated = async (newItem: LocalItem) => {
    setItems((currentItems) => [...currentItems, newItem]);
    setError('');
  };

  const handleItemStatusChange = async (
    itemId: string,
    newStatus: 'pending' | 'purchased' | 'not_purchased' | 'meditating' | 'cancelled'
  ) => {
    const item = items.find(i => i.id === itemId);
    if (newStatus === 'cancelled' && item) {
      const recoveredDays = calculateSalaryDays(item.price, (userConfig.zone as 'general' | 'frontera') || 'general');
      setVictoryMessage({ show: true, days: recoveredDays });
      setTimeout(() => setVictoryMessage({ show: false, days: 0 }), 5000);
    }
    setItems(items.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item)));
  };

  const getFilteredItems = () => {
    const statusMap: Record<string, string> = {
      pendientes: 'pending',
      meditando: 'meditating',
      compradas: 'purchased',
      no_compradas: 'not_purchased',
    };
    return items.filter((item) => item.status === statusMap[activeTab]);
  };

  const filteredItems = getFilteredItems();
  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const meditatingCount = items.filter((i) => i.status === 'meditating').length;
  const purchasedCount = items.filter((i) => i.status === 'purchased').length;
  const notPurchasedCount = items.filter((i) => i.status === 'not_purchased').length;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    const tabs = ['pendientes', 'meditando', 'compradas', 'no_compradas'] as const;
    setActiveTab(tabs[newValue]);
  };

  const tabIndex = ['pendientes', 'meditando', 'compradas', 'no_compradas'].indexOf(activeTab);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Main Content */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        {/* Encabezado principal de la página (accesibilidad: navegación por h1) */}
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 700, mb: 1 }}
        >
          Calculadora de días de salario
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Descubre cuántos días de trabajo cuesta lo que deseas comprar.
        </Typography>

        {/* Auth Section */}
        <Box
          sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3, gap: 2 }}
        >
          {status === 'loading' && !session && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Comprobando sesión...
            </Typography>
          )}
          {session ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {session.user?.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Autenticado
                </Typography>
              </Box>
              <Button
                onClick={() => signOut()}
                variant="contained"
                color="error"
                size="small"
                sx={{ textTransform: 'none' }}
              >
                Salir
              </Button>
            </Box>
          ) : (
            <Button
              onClick={() => signIn()}
              variant="contained"
              color="primary"
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Iniciar sesión
            </Button>
          )}
        </Box>

        {/* Item Form */}
        <Card sx={{ mb: 4, boxShadow: '0 1px 2px rgba(16,16,16,0.04)' }}>
          <CardContent>
            <ItemForm onItemCreated={handleItemCreated} onError={setError} />
          </CardContent>
        </Card>

        {/* Financial Health Summary */}
        <FinancialHealthSummary items={items} userConfig={userConfig} victoryMessage={victoryMessage} />

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            <Typography variant="body2">
              <strong>Error:</strong> {error}
            </Typography>
          </Alert>
        )}

        {/* Config Alert */}
        {(!userConfig.zone || !userConfig.monthlyIncome) && (
          <Alert
            severity="info"
            sx={{ mb: 4 }}
            action={
              <Button
                component={Link}
                href="/onboarding"
                variant="outlined"
                size="small"
                sx={{ textTransform: 'none' }}
              >
                Configurar
              </Button>
            }
          >
            <Typography variant="body2">
              <strong>Configura tu zona e ingreso mensual</strong> para cálculos personalizados de días de salario y porcentaje de tu ingreso.
            </Typography>
          </Alert>
        )}

        {/* Items Section */}
        <Card sx={{ boxShadow: '0 1px 2px rgba(16,16,16,0.04)' }}>
          <CardContent>
            {/* Tabs */}
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}>
              <Tabs
                value={tabIndex}
                onChange={handleTabChange}
                aria-label="Filtrar artículos por estado"
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      color: 'primary.main',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'primary.main',
                  },
                }}
              >
                <Tab label={`⏳ Pendientes (${pendingCount})`} />
                <Tab label={`🧘 Meditando (${meditatingCount})`} />
                <Tab label={`✅ Compradas (${purchasedCount})`} />
                <Tab label={`❌ Canceladas (${notPurchasedCount})`} />
              </Tabs>
            </Box>

            {/* Items List or Empty State */}
            {isLoadingData ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Cargando artículos...
                </Typography>
              </Box>
            ) : filteredItems.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                  {activeTab === 'pendientes' && '¡Agrega un artículo para comenzar!'}
                  {activeTab === 'meditando' && 'Sin artículos en meditación.'}
                  {activeTab === 'compradas' && 'Sin artículos comprados aún.'}
                  {activeTab === 'no_compradas' && 'Sin artículos cancelados aún.'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredItems.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    <Box sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={8}>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}
                          >
                            {item.description}
                          </Typography>
                          {item.notes && (
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                              📝 {item.notes}
                            </Typography>
                          )}
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            📅 {new Date(item.createdAt).toLocaleDateString('es-MX')}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 700,
                              color: 'primary.main',
                              mb: 0.5,
                            }}
                          >
                            ${item.price.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {calculateSalaryDays(item.price, (userConfig.zone as 'general' | 'frontera') || 'general')} días de salario
                          </Typography>
                        </Grid>
                      </Grid>

                      {/* Action Buttons for Pending Items */}
                      {activeTab === 'pendientes' && (
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 1.5,
                            mt: 2,
                            flexDirection: { xs: 'column', sm: 'row' },
                          }}
                        >
                          <Button
                            onClick={() => handleItemStatusChange(item.id, 'purchased')}
                            variant="contained"
                            color="success"
                            sx={{ flex: 1, textTransform: 'none' }}
                          >
                            ✅ Lo compré
                          </Button>
                          <Button
                            onClick={() => handleItemStatusChange(item.id, 'cancelled')}
                            variant="contained"
                            color="error"
                            sx={{ flex: 1, textTransform: 'none' }}
                          >
                            ❌ No lo compré
                          </Button>
                        </Box>
                      )}

                      {/* Meditation Timer and Actions for Meditating Items */}
                      {activeTab === 'meditando' && item.meditationStartedAt && (
                        <Box sx={{ mt: 2 }}>
                          <MeditationTimer
                            startedAt={item.meditationStartedAt}
                            onComplete={() => {
                              // Auto-move to pending when meditation completes
                              handleItemStatusChange(item.id, 'pending');
                            }}
                          />
                          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                            Tu &apos;yo del futuro&apos; está evaluando si esto vale{' '}
                            {calculateSalaryDays(item.price, (userConfig.zone as 'general' | 'frontera') || 'general')} días de trabajo.
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 1.5,
                              mt: 2,
                              flexDirection: { xs: 'column', sm: 'row' },
                            }}
                          >
                            {/* Mientras el item esté en "meditando" la compra está bloqueada;
                                al completarse las 72h, MeditationTimer lo regresa a pendientes
                                automáticamente, donde sí se puede marcar como comprado. */}
                            <Button
                              variant="contained"
                              disabled
                              sx={{ flex: 1, textTransform: 'none' }}
                            >
                              ⏳ Bloqueado hasta completar meditación
                            </Button>
                            <Button
                              onClick={() => handleItemStatusChange(item.id, 'cancelled')}
                              variant="outlined"
                              color="error"
                              sx={{
                                flex: 1,
                                textTransform: 'none',
                              }}
                            >
                              ❌ Cancelar Compra
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Box>

                    {idx < filteredItems.length - 1 && (
                      <Box sx={{ height: '1px', bgcolor: 'divider' }} />
                    )}
                  </React.Fragment>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Shadow Profile Info */}
        {!session && (
          <Alert severity="info" sx={{ mt: 4 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              💡 Datos locales
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Tus datos se guardan localmente en tu navegador. Si inicias sesión, podremos fusionar
              tu historial.
            </Typography>
            <Button
              onClick={() => signIn()}
              variant="text"
              size="small"
              color="primary"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Iniciar sesión para sincronizar
            </Button>
          </Alert>
        )}

        {/* Credit Marketplace */}
        <CreditMarketplace
          items={items}
          userConfig={userConfig}
          userName={session?.user?.name || 'Usuario'}
        />
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          mt: 'auto',
          py: 3,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            MVP &ldquo;Días de Salario&rdquo; © 2026 • Privacidad · Ayuda · Contacto
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
