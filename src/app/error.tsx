'use client';

/**
 * Error boundary global de la aplicación.
 * Captura errores de render no manejados y ofrece reintentar sin recargar todo.
 */

import { useEffect } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log del lado del cliente; el digest permite correlacionar con logs del servidor.
    console.error('Error no manejado:', error.digest ?? error.message);
  }, [error]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8, textAlign: 'center' }} role="alert">
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
          Algo salió mal
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Ocurrió un error inesperado. Tus datos locales están a salvo — puedes intentar de nuevo.
        </Typography>
        <Button variant="contained" color="primary" onClick={reset} sx={{ textTransform: 'none' }}>
          Intentar de nuevo
        </Button>
      </Box>
    </Container>
  );
}
