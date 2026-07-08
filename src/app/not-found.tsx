'use client';

/**
 * Página 404 con la identidad de la app.
 * Client Component: MUI Button recibe `component={Link}` (una función), lo cual
 * no puede serializarse desde un Server Component.
 */

import Link from 'next/link';
import { Box, Button, Container, Typography } from '@mui/material';

export default function NotFound() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
          Página no encontrada
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          La página que buscas no existe o fue movida.
        </Typography>
        <Button
          component={Link}
          href="/"
          variant="contained"
          color="primary"
          sx={{ textTransform: 'none' }}
        >
          Volver al inicio
        </Button>
      </Box>
    </Container>
  );
}
