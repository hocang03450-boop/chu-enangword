import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'teal' | 'blue' | 'red' | 'amber' | 'purple' | 'lime';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'red', setTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('red');

  useEffect(() => {
    // Define color palettes for body background and scrollbars
    const colors: Record<Theme, { bg: string, scrollTrack: string, scrollThumb: string, scrollThumbHover: string }> = {
        teal: { bg: '#f0fdfa', scrollTrack: '#ccfbf1', scrollThumb: '#14b8a6', scrollThumbHover: '#0d9488' },
        blue: { bg: '#eff6ff', scrollTrack: '#dbeafe', scrollThumb: '#2563eb', scrollThumbHover: '#1d4ed8' },
        red: { bg: '#fef2f2', scrollTrack: '#fee2e2', scrollThumb: '#dc2626', scrollThumbHover: '#b91c1c' },
        amber: { bg: '#fffbeb', scrollTrack: '#fef3c7', scrollThumb: '#d97706', scrollThumbHover: '#b45309' },
        purple: { bg: '#faf5ff', scrollTrack: '#f3e8ff', scrollThumb: '#9333ea', scrollThumbHover: '#7e22ce' },
        lime: { bg: '#f7fee7', scrollTrack: '#ecfccb', scrollThumb: '#65a30d', scrollThumbHover: '#4d7c0f' },
    };
    
    const c = colors[theme];
    document.body.style.backgroundColor = c.bg;
    
    // Inject dynamic styles for scrollbar customization
    let styleTag = document.getElementById('theme-styles');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'theme-styles';
        document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `
        ::-webkit-scrollbar-track { background: ${c.scrollTrack}; }
        ::-webkit-scrollbar-thumb { background: ${c.scrollThumb}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${c.scrollThumbHover}; }
    `;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};