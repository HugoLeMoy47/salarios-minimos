'use client';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: '1px solid rgba(16,16,16,0.04)', backgroundColor: 'transparent' }}
    >
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, padding: '0.5rem 0' }}
        >
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              Días de Salario
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ThemeToggle />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
