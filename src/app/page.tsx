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
  const [activeTab, setActiveTab] = useState<'pendientes' | 'meditando' | 'compradas' | 'no_compradas'>(
    'pendientes'
  );
  const [userConfig, setUserConfig] = useState<{ zone?: 'general' | 'frontera'; monthlyIncome?: number }>({});
  const [victoryMessage, setVictoryMessage] = useState<{ show: boolean; days: number }>({ show: false, days: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const shadowItems = await getAllShadowItems();
        setItems(shadowItems);
        const config = await getUserConfig();
        setUserConfig(config);
      } catch (err) {
        console.error('Error cargando datos:', err);
      }
    };

    fetchData();
  }, []);

  const handleItemCreated = async (newItem: LocalItem) => {
    setItems([...items, newItem]);
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
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f3f2f1' }}>
      {/* Main Content */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        {/* Auth Section */}
        <Box
          sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3, gap: 2 }}
        >
          {status === 'loading' && (
            <Typography variant="body2" sx={{ color: '#605e5c' }}>
              Cargando...
            </Typography>
          )}
          {session ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#323130' }}>
                  {session.user?.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#605e5c' }}>
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
          <Alert
            severity="error"
            sx={{ mb: 4, bgcolor: '#fde7e7', color: '#942911', border: '1px solid #fed0d0' }}
          >
            <Typography variant="body2">
              <strong>Error:</strong> {error}
            </Typography>
          </Alert>
        )}

        {/* Config Alert */}
        {(!userConfig.zone || !userConfig.monthlyIncome) && (
          <Alert
            severity="info"
            sx={{ mb: 4, bgcolor: '#e7f3ff', color: '#0f3c5a', border: '1px solid #c7e4f7' }}
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
            <Box sx={{ borderBottom: '1px solid #e1dfdd', mb: 3 }}>
              <Tabs
                value={tabIndex}
                onChange={handleTabChange}
                aria-label="filter tabs"
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: '#605e5c',
                    '&.Mui-selected': {
                      color: '#0078d4',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#0078d4',
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
            {filteredItems.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" sx={{ color: '#605e5c', mb: 1 }}>
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
                            sx={{ fontWeight: 600, color: '#323130', mb: 0.5 }}
                          >
                            {item.description}
                          </Typography>
                          {item.notes && (
                            <Typography variant="body2" sx={{ color: '#605e5c', mb: 1 }}>
                              📝 {item.notes}
                            </Typography>
                          )}
                          <Typography variant="caption" sx={{ color: '#707070' }}>
                            📅 {new Date(item.createdAt).toLocaleDateString('es-MX')}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 700,
                              color: '#0078d4',
                              mb: 0.5,
                            }}
                          >
                            ${item.price.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#605e5c' }}>
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
                            sx={{
                              backgroundColor: '#107c10',
                              '&:hover': { backgroundColor: '#0b5f0b' },
                              flex: 1,
                              textTransform: 'none',
                            }}
                          >
                            ✅ Lo compré
                          </Button>
                          <Button
                            onClick={() => handleItemStatusChange(item.id, 'cancelled')}
                            variant="contained"
                            sx={{
                              backgroundColor: '#d13438',
                              '&:hover': { backgroundColor: '#a4373a' },
                              flex: 1,
                              textTransform: 'none',
                            }}
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
                          <Typography variant="body2" sx={{ mt: 1, color: '#605e5c' }}>
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
                            <Button
                              onClick={() => handleItemStatusChange(item.id, 'purchased')}
                              variant="contained"
                              disabled={item.meditationEndsAt ? new Date(item.meditationEndsAt).getTime() > Date.now() : true}
                              sx={{
                                backgroundColor: item.meditationEndsAt && new Date(item.meditationEndsAt).getTime() <= Date.now() ? '#107c10' : '#cccccc',
                                '&:hover': item.meditationEndsAt && new Date(item.meditationEndsAt).getTime() <= Date.now() ? { backgroundColor: '#0b5f0b' } : {},
                                '&:disabled': { backgroundColor: '#e0e0e0' },
                                flex: 1,
                                textTransform: 'none',
                              }}
                            >
                              {item.meditationEndsAt && new Date(item.meditationEndsAt).getTime() <= Date.now() ? '✅ Marcar como comprado' : '⏳ Bloqueado hasta completar meditación'}
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
                      <Box sx={{ height: '1px', bgcolor: '#e1dfdd' }} />
                    )}
                  </React.Fragment>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Shadow Profile Info */}
        {!session && (
          <Alert
            severity="info"
            sx={{
              mt: 4,
              bgcolor: '#eff6fc',
              color: '#0078d4',
              border: '1px solid #b4d6f5',
              '& .MuiAlert-icon': { color: '#0078d4' },
            }}
          >
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
              sx={{ color: '#0078d4', textTransform: 'none', fontWeight: 600 }}
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
          bgcolor: '#ffffff',
          borderTop: '1px solid #e1dfdd',
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
              color: '#605e5c',
            }}
          >
            MVP &ldquo;Días de Salario&rdquo; © 2026 • Privacidad · Ayuda · Contacto
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
