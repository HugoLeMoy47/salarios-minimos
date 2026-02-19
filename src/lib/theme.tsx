'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, PaletteMode } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';

type ThemeContextType = {
  mode: PaletteMode;
  toggleMode: () => void;
};

const ThemeModeContext = createContext<ThemeContextType | undefined>(undefined);

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<PaletteMode>('light');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme-mode');
      if (stored === 'light' || stored === 'dark') {
        setMode(stored);
        return;
      }
    } catch {}
    setMode(prefersDark ? 'dark' : 'light');
  }, [prefersDark]);

  useEffect(() => {
    try {
      localStorage.setItem('theme-mode', mode);
    } catch {}
  }, [mode]);

  const toggleMode = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#1976d2' },
          background: {
            default: mode === 'light' ? '#ffffff' : '#0a0a0a',
            paper: mode === 'light' ? '#ffffff' : '#121212',
          },
        },
        typography: {
          button: {
            textTransform: 'none',
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
}
