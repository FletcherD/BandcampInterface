import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { BandcampPageStyle } from '../api/bandcamp';

type Theme = 'default' | 'bandcamp';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  bandcampStyle: BandcampPageStyle | null;
  setBandcampStyle: (style: BandcampPageStyle | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'bandcamp-interface-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Load theme from localStorage, default to 'default'
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return (saved === 'bandcamp' || saved === 'default') ? saved : 'default';
  });

  const [bandcampStyle, setBandcampStyle] = useState<BandcampPageStyle | null>(null);

  // Persist theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'default' ? 'bandcamp' : 'default');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, bandcampStyle, setBandcampStyle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
