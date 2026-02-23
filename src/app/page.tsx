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
import { ItemForm } from '@/components/ItemForm';
import { LocalItem, getAllShadowItems } from '@/lib/shadow-profile';

export default function Home() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<LocalItem[]>([]);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pendientes' | 'compradas' | 'no_compradas'>(
    'pendientes'
  );

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const shadowItems = await getAllShadowItems();
        setItems(shadowItems);
      } catch (err) {
        console.error('Error cargando items:', err);
      }
    };

    fetchItems();
  }, []);

  const handleItemCreated = async (newItem: LocalItem) => {
    setItems([...items, newItem]);
    setError('');
  };

  const handleItemStatusChange = async (
    itemId: string,
    newStatus: 'purchased' | 'not_purchased'
  ) => {
    setItems(items.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item)));
  };

  const getFilteredItems = () => {
    const statusMap: Record<string, 'pending' | 'purchased' | 'not_purchased'> = {
      pendientes: 'pending',
      compradas: 'purchased',
      no_compradas: 'not_purchased',
    };
    return items.filter((item) => item.status === statusMap[activeTab]);
  };

  const filteredItems = getFilteredItems();
  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const purchasedCount = items.filter((i) => i.status === 'purchased').length;
  const notPurchasedCount = items.filter((i) => i.status === 'not_purchased').length;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    const tabs = ['pendientes', 'compradas', 'no_compradas'] as const;
    setActiveTab(tabs[newValue]);
  };

  const tabIndex = ['pendientes', 'compradas', 'no_compradas'].indexOf(activeTab);

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
                <Tab label={`✅ Compradas (${purchasedCount})`} />
                <Tab label={`❌ No compradas (${notPurchasedCount})`} />
              </Tabs>
            </Box>

            {/* Items List or Empty State */}
            {filteredItems.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" sx={{ color: '#605e5c', mb: 1 }}>
                  {activeTab === 'pendientes' && '¡Agrega un artículo para comenzar!'}
                  {activeTab === 'compradas' && 'Sin artículos comprados aún.'}
                  {activeTab === 'no_compradas' && 'Sin artículos descartados aún.'}
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
                            {Math.round((item.price / 241.56) * 10) / 10} días de salario
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
                            onClick={() => handleItemStatusChange(item.id, 'not_purchased')}
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
