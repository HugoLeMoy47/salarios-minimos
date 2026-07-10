import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeModeProvider, useThemeMode } from '../theme';
import ThemeToggle from '../../components/ThemeToggle';

function ThemeProbe() {
  const { mode } = useThemeMode();
  return <span data-testid="mode">{mode}</span>;
}

describe('ThemeModeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
  });

  it('toggle changes the document theme and persists the preference', () => {
    render(
      <ThemeModeProvider>
        <ThemeProbe />
        <ThemeToggle />
      </ThemeModeProvider>
    );

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('theme-mode')).toBe('light');

    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));

    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(localStorage.getItem('theme-mode')).toBe('dark');
  });
});
