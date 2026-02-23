'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  responsiveFontSizes,
  PaletteMode,
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

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
  // initialize from localStorage once; default to light
  const [mode, setMode] = useState<PaletteMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('theme-mode');
        if (stored === 'light' || stored === 'dark') {
          return stored;
        }
      } catch {}
    }
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('theme-mode', mode);
    } catch {}
  }, [mode]);

  const toggleMode = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));

  const theme = useMemo(() => {
    const base = createTheme({
      palette: {
        mode,
        primary: { main: '#0078d4', contrastText: '#ffffff' },
        secondary: { main: '#2b88d8' },
        background: {
          default: mode === 'light' ? '#f3f2f1' : '#121214',
          paper: mode === 'light' ? '#ffffff' : '#1b1b1d',
        },
        text: {
          primary: mode === 'light' ? '#323130' : '#f3f2f1',
          secondary: mode === 'light' ? '#605e5c' : '#c8c6c4',
        },
      },
      shape: { borderRadius: 8 },
      components: {
        MuiButton: {
          defaultProps: { disableElevation: true },
          styleOverrides: {
            root: {
              borderRadius: 8,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: { backgroundImage: 'none' },
          },
        },
        MuiTextField: {
          defaultProps: { variant: 'outlined' },
        },
      },
      typography: {
        button: { textTransform: 'none' },
        fontFamily: 'var(--font-geist-sans), Arial, Helvetica, sans-serif',
        h1: { fontWeight: 700 },
      },
      spacing: 8,
    });

    return responsiveFontSizes(base);
  }, [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
}
