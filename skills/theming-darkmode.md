---
name: theming-darkmode
description: Theme system and dark mode expert. Use for implementing theme switching, CSS variables, Tailwind dark mode, and consistent design systems in React apps.
---

# Theming & Dark Mode Skill

Expert guide for implementing theme systems, dark mode, and design tokens in React/Next.js apps.

## Quick Setup Options

| Method | Best For | Complexity |
|--------|----------|------------|
| **Tailwind dark:** | Simple dark/light | Easy |
| **CSS Variables** | Custom themes | Medium |
| **next-themes** | Next.js apps | Easy |
| **styled-components** | CSS-in-JS | Medium |
| **shadcn/ui themes** | shadcn projects | Easy |

## Tailwind Dark Mode (Simplest)

### Enable Dark Mode

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media' for system preference
  theme: {
    extend: {
      colors: {
        // Custom colors that work in both modes
        primary: {
          DEFAULT: '#3b82f6',
          dark: '#60a5fa',
        },
      },
    },
  },
};
```

### Usage in Components

```tsx
// Components automatically adapt
<div className="bg-white dark:bg-gray-900">
  <h1 className="text-gray-900 dark:text-white">Title</h1>
  <p className="text-gray-600 dark:text-gray-300">Description</p>
  <button className="bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700">
    Click Me
  </button>
</div>
```

### Theme Toggle Component

```tsx
// components/ThemeToggle.tsx
import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check localStorage or system preference
    const isDark = localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      aria-label="Toggle theme"
    >
      {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};
```

## Next.js + next-themes (Recommended)

### Installation

```bash
npm install next-themes
```

### Provider Setup

```tsx
// app/providers.tsx
'use client';

import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Theme Toggle with next-themes

```tsx
// components/ThemeToggle.tsx
'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

export const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded ${theme === 'light' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded ${theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded ${theme === 'system' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
};
```

## CSS Variables Theme System

### Define Design Tokens

```css
/* globals.css */
:root {
  /* Colors */
  --color-background: 255 255 255;
  --color-foreground: 15 23 42;
  --color-primary: 59 130 246;
  --color-primary-foreground: 255 255 255;
  --color-secondary: 241 245 249;
  --color-secondary-foreground: 15 23 42;
  --color-muted: 241 245 249;
  --color-muted-foreground: 100 116 139;
  --color-accent: 241 245 249;
  --color-accent-foreground: 15 23 42;
  --color-destructive: 239 68 68;
  --color-destructive-foreground: 255 255 255;
  --color-border: 226 232 240;
  --color-input: 226 232 240;
  --color-ring: 59 130 246;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

.dark {
  --color-background: 15 23 42;
  --color-foreground: 248 250 252;
  --color-primary: 96 165 250;
  --color-primary-foreground: 15 23 42;
  --color-secondary: 30 41 59;
  --color-secondary-foreground: 248 250 252;
  --color-muted: 30 41 59;
  --color-muted-foreground: 148 163 184;
  --color-accent: 30 41 59;
  --color-accent-foreground: 248 250 252;
  --color-destructive: 239 68 68;
  --color-destructive-foreground: 255 255 255;
  --color-border: 51 65 85;
  --color-input: 51 65 85;
  --color-ring: 96 165 250;
}
```

### Tailwind Config for CSS Variables

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          foreground: 'rgb(var(--color-primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          foreground: 'rgb(var(--color-secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--color-muted) / <alpha-value>)',
          foreground: 'rgb(var(--color-muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          foreground: 'rgb(var(--color-accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--color-destructive) / <alpha-value>)',
          foreground: 'rgb(var(--color-destructive-foreground) / <alpha-value>)',
        },
        border: 'rgb(var(--color-border) / <alpha-value>)',
        input: 'rgb(var(--color-input) / <alpha-value>)',
        ring: 'rgb(var(--color-ring) / <alpha-value>)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
    },
  },
};
```

### Usage

```tsx
// Now use semantic colors everywhere
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground hover:bg-primary/90">
    Primary Button
  </button>
  <p className="text-muted-foreground">Secondary text</p>
  <div className="border border-border rounded-lg p-4">
    Card content
  </div>
</div>
```

## Multiple Theme Support

### Theme Context

```tsx
// contexts/ThemeContext.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'blue' | 'green' | 'purple';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes: Record<Theme, Record<string, string>> = {
  light: {
    '--color-background': '255 255 255',
    '--color-foreground': '15 23 42',
    '--color-primary': '59 130 246',
  },
  dark: {
    '--color-background': '15 23 42',
    '--color-foreground': '248 250 252',
    '--color-primary': '96 165 250',
  },
  blue: {
    '--color-background': '239 246 255',
    '--color-foreground': '30 58 138',
    '--color-primary': '37 99 235',
  },
  green: {
    '--color-background': '240 253 244',
    '--color-foreground': '20 83 45',
    '--color-primary': '22 163 74',
  },
  purple: {
    '--color-background': '250 245 255',
    '--color-foreground': '88 28 135',
    '--color-primary': '147 51 234',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = localStorage.getItem('app-theme') as Theme;
    if (saved && themes[saved]) {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const themeVars = themes[theme];

    Object.entries(themeVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Toggle dark class for Tailwind
    root.classList.toggle('dark', theme === 'dark');

    localStorage.setItem('app-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

### Theme Picker Component

```tsx
// components/ThemePicker.tsx
import { useTheme } from '@/contexts/ThemeContext';

const themeOptions = [
  { id: 'light', name: 'Light', color: '#ffffff' },
  { id: 'dark', name: 'Dark', color: '#0f172a' },
  { id: 'blue', name: 'Ocean', color: '#3b82f6' },
  { id: 'green', name: 'Forest', color: '#22c55e' },
  { id: 'purple', name: 'Grape', color: '#a855f7' },
];

export const ThemePicker = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-2">
      {themeOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => setTheme(option.id as any)}
          className={`w-8 h-8 rounded-full border-2 transition-transform ${
            theme === option.id ? 'scale-110 border-primary' : 'border-transparent'
          }`}
          style={{ backgroundColor: option.color }}
          title={option.name}
        />
      ))}
    </div>
  );
};
```

## shadcn/ui Theming

### Theme Configuration

```css
/* globals.css - shadcn default */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

### Custom Theme Generator

```tsx
// utils/generateTheme.ts
import { colord, extend } from 'colord';
import harmoniesPlugin from 'colord/plugins/harmonies';

extend([harmoniesPlugin]);

export function generateTheme(primaryColor: string) {
  const primary = colord(primaryColor);

  return {
    light: {
      '--primary': primary.toHslString(),
      '--primary-foreground': primary.isDark() ? '0 0% 100%' : '0 0% 0%',
      '--background': '0 0% 100%',
      '--foreground': '0 0% 0%',
      // Generate complementary colors
      '--secondary': primary.lighten(0.4).toHslString(),
      '--accent': primary.rotate(30).toHslString(),
    },
    dark: {
      '--primary': primary.lighten(0.2).toHslString(),
      '--primary-foreground': primary.isDark() ? '0 0% 100%' : '0 0% 0%',
      '--background': '222.2 84% 4.9%',
      '--foreground': '210 40% 98%',
      '--secondary': primary.darken(0.3).toHslString(),
      '--accent': primary.rotate(30).lighten(0.1).toHslString(),
    },
  };
}
```

## Animations & Transitions

### Smooth Theme Transitions

```css
/* globals.css */
* {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Disable for specific elements */
.no-transition {
  transition: none !important;
}
```

### Prevent Flash on Load

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') ||
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.classList.toggle('dark', theme === 'dark');
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## Best Practices

1. **Use CSS variables** - Maximum flexibility for theming
2. **Semantic color names** - `primary`, `background` not `blue`, `white`
3. **Test contrast ratios** - Ensure accessibility in all themes
4. **Persist preference** - Save to localStorage
5. **Respect system preference** - Default to user's OS setting
6. **Smooth transitions** - Animate theme changes
7. **Prevent flash** - Load theme before render
8. **Test all states** - Hover, focus, disabled in all themes

## Integration with Other Skills

- **ui-designer**: Create theme-aware components
- **react-expert**: Theme context patterns
- **content-creator**: Consistent brand colors
- **i18n-multilang**: Theme picker in multiple languages