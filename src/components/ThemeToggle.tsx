'use client';

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useThemeMode } from '@/lib/theme';

export default function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode();

  return (
    <Tooltip title={mode === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}>
      <IconButton onClick={toggleMode} color="inherit" aria-label="toggle theme">
        {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
