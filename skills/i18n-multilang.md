---
name: i18n-multilang
description: Internationalization (i18n) expert for multi-language websites. Use for implementing translations, locale switching, RTL support, and language detection in React/Next.js apps.
---

# Internationalization (i18n) Skill

Expert guide for building multi-language websites with React, Next.js, and related frameworks.

## Quick Reference

| Library | Framework | Best For |
|---------|-----------|----------|
| **react-i18next** | React | Most popular, flexible |
| **next-intl** | Next.js | App Router native |
| **next-i18next** | Next.js Pages | Pages Router |
| **i18next** | Any | Core library |
| **formatjs** | React | ICU message format |
| **lingui** | React | Compile-time |

## React + i18next Setup (Recommended)

### Installation

```bash
npm install i18next react-i18next i18next-browser-languagedetector i18next-http-backend
```

### Configuration

```typescript
// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'fr', 'de', 'zh', 'ar'],
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React already escapes
    },

    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    ns: ['common', 'auth', 'dashboard'],
    defaultNS: 'common',
  });

export default i18n;
```

### Translation Files Structure

```
public/
└── locales/
    ├── en/
    │   ├── common.json
    │   ├── auth.json
    │   └── dashboard.json
    ├── es/
    │   ├── common.json
    │   ├── auth.json
    │   └── dashboard.json
    └── ar/
        ├── common.json
        ├── auth.json
        └── dashboard.json
```

### Translation JSON Examples

```json
// locales/en/common.json
{
  "nav": {
    "home": "Home",
    "about": "About Us",
    "contact": "Contact",
    "services": "Services"
  },
  "footer": {
    "copyright": "Copyright {{year}} {{company}}. All rights reserved.",
    "privacy": "Privacy Policy",
    "terms": "Terms of Service"
  },
  "buttons": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save Changes",
    "delete": "Delete"
  },
  "messages": {
    "success": "Operation completed successfully",
    "error": "An error occurred. Please try again.",
    "loading": "Loading..."
  }
}
```

```json
// locales/es/common.json
{
  "nav": {
    "home": "Inicio",
    "about": "Sobre Nosotros",
    "contact": "Contacto",
    "services": "Servicios"
  },
  "footer": {
    "copyright": "Copyright {{year}} {{company}}. Todos los derechos reservados.",
    "privacy": "Politica de Privacidad",
    "terms": "Terminos de Servicio"
  },
  "buttons": {
    "submit": "Enviar",
    "cancel": "Cancelar",
    "save": "Guardar Cambios",
    "delete": "Eliminar"
  },
  "messages": {
    "success": "Operacion completada exitosamente",
    "error": "Ocurrio un error. Por favor intente de nuevo.",
    "loading": "Cargando..."
  }
}
```

### Using Translations in Components

```tsx
// src/components/Header.tsx
import { useTranslation } from 'react-i18next';

export const Header = () => {
  const { t, i18n } = useTranslation();

  return (
    <header>
      <nav>
        <a href="/">{t('nav.home')}</a>
        <a href="/about">{t('nav.about')}</a>
        <a href="/contact">{t('nav.contact')}</a>
      </nav>

      {/* Language Switcher */}
      <LanguageSwitcher />
    </header>
  );
};
```

### Language Switcher Component

```tsx
// src/components/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English', flag: 'US' },
  { code: 'es', name: 'Espanol', flag: 'ES' },
  { code: 'fr', name: 'Francais', flag: 'FR' },
  { code: 'de', name: 'Deutsch', flag: 'DE' },
  { code: 'zh', name: '中文', flag: 'CN' },
  { code: 'ar', name: 'العربية', flag: 'SA' },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // Update HTML lang attribute
    document.documentElement.lang = lng;
    // Update direction for RTL languages
    document.documentElement.dir = ['ar', 'he', 'fa'].includes(lng) ? 'rtl' : 'ltr';
  };

  return (
    <select
      value={i18n.language}
      onChange={(e) => changeLanguage(e.target.value)}
      className="border rounded p-2"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
};
```

## Next.js App Router (next-intl)

### Installation

```bash
npm install next-intl
```

### Configuration

```typescript
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../../messages/${locale}.json`)).default
}));
```

```typescript
// next.config.js
const withNextIntl = require('next-intl/plugin')();

module.exports = withNextIntl({
  // Your Next.js config
});
```

### Middleware for Locale Detection

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'es', 'fr', 'de'],
  defaultLocale: 'en',
  localeDetection: true,
});

export const config = {
  matcher: ['/', '/(de|en|es|fr)/:path*']
};
```

### App Router Structure

```
app/
├── [locale]/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── about/
│   │   └── page.tsx
│   └── contact/
│       └── page.tsx
├── layout.tsx
└── globals.css
```

### Using next-intl

```tsx
// app/[locale]/page.tsx
import { useTranslations } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';

export default function HomePage({ params: { locale } }) {
  unstable_setRequestLocale(locale);
  const t = useTranslations('HomePage');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

## RTL Support (Arabic, Hebrew)

### CSS for RTL

```css
/* globals.css */
:root {
  --spacing-start: 0;
  --spacing-end: 0;
}

[dir="ltr"] {
  --spacing-start: left;
  --spacing-end: right;
}

[dir="rtl"] {
  --spacing-start: right;
  --spacing-end: left;
}

/* Use logical properties */
.sidebar {
  margin-inline-start: 1rem; /* margin-left in LTR, margin-right in RTL */
  padding-inline-end: 2rem;  /* padding-right in LTR, padding-left in RTL */
}

/* Or use CSS variables */
.card {
  text-align: var(--spacing-start);
  border-left: none;
  border-inline-start: 2px solid blue;
}
```

### Tailwind RTL Plugin

```bash
npm install tailwindcss-rtl
```

```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('tailwindcss-rtl'),
  ],
}
```

```tsx
// Usage in components
<div className="ms-4 me-2 ps-3 pe-1">
  {/* ms = margin-start, me = margin-end */}
  {/* ps = padding-start, pe = padding-end */}
</div>
```

## Pluralization & Formatting

### Plurals

```json
// en/common.json
{
  "items": {
    "zero": "No items",
    "one": "{{count}} item",
    "other": "{{count}} items"
  },
  "messages_unread": "You have {{count}} unread message",
  "messages_unread_plural": "You have {{count}} unread messages"
}
```

```tsx
// Usage
const { t } = useTranslation();

// Automatic plural handling
<p>{t('items', { count: 0 })}</p>  // "No items"
<p>{t('items', { count: 1 })}</p>  // "1 item"
<p>{t('items', { count: 5 })}</p>  // "5 items"
```

### Date & Number Formatting

```tsx
import { useTranslation } from 'react-i18next';

const FormattedContent = () => {
  const { t, i18n } = useTranslation();

  // Date formatting
  const date = new Date();
  const formattedDate = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);

  // Number formatting
  const price = 1234567.89;
  const formattedPrice = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: i18n.language === 'en' ? 'USD' : 'EUR',
  }).format(price);

  return (
    <div>
      <p>{formattedDate}</p>
      <p>{formattedPrice}</p>
    </div>
  );
};
```

## SEO for Multi-language

### Hreflang Tags

```tsx
// components/LocaleHead.tsx
import Head from 'next/head';
import { useRouter } from 'next/router';

const locales = ['en', 'es', 'fr', 'de'];

export const LocaleHead = () => {
  const { asPath } = useRouter();
  const baseUrl = 'https://example.com';

  return (
    <Head>
      {locales.map((locale) => (
        <link
          key={locale}
          rel="alternate"
          hrefLang={locale}
          href={`${baseUrl}/${locale}${asPath}`}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/en${asPath}`} />
    </Head>
  );
};
```

### Sitemap with Locales

```typescript
// scripts/generate-sitemap.ts
const pages = ['/', '/about', '/contact', '/services'];
const locales = ['en', 'es', 'fr', 'de'];
const baseUrl = 'https://example.com';

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages.map(page => locales.map(locale => `
  <url>
    <loc>${baseUrl}/${locale}${page}</loc>
    ${locales.map(l => `
    <xhtml:link rel="alternate" hreflang="${l}" href="${baseUrl}/${l}${page}"/>
    `).join('')}
  </url>
`).join('')).join('')}
</urlset>`;
```

## Translation Management

### Extract Keys Script

```bash
# Using i18next-parser
npm install -D i18next-parser

# i18next-parser.config.js
module.exports = {
  locales: ['en', 'es', 'fr'],
  output: 'public/locales/$LOCALE/$NAMESPACE.json',
  input: ['src/**/*.{ts,tsx}'],
  sort: true,
};

# Run extraction
npx i18next-parser
```

### Multi-agent Translation

```javascript
// Use multi-agent MCP for bulk translation
mcp__multi-agent__spawn_agents({
  model: "gemini-3-pro",
  tasks: [
    { id: "es", task: "Translate this JSON to Spanish: {...}" },
    { id: "fr", task: "Translate this JSON to French: {...}" },
    { id: "de", task: "Translate this JSON to German: {...}" },
    { id: "zh", task: "Translate this JSON to Chinese: {...}" },
  ]
})
```

## Testing i18n

```typescript
// __tests__/i18n.test.tsx
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n/config';
import { Header } from '../src/components/Header';

describe('i18n', () => {
  it('renders English by default', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Header />
      </I18nextProvider>
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders Spanish when language changed', async () => {
    await i18n.changeLanguage('es');
    render(
      <I18nextProvider i18n={i18n}>
        <Header />
      </I18nextProvider>
    );
    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Use namespaces** - Organize translations by feature/page
2. **Lazy load translations** - Don't bundle all languages
3. **Context for translators** - Add comments for unclear strings
4. **Avoid concatenation** - Use interpolation instead
5. **Handle plurals properly** - Different rules per language
6. **Test RTL early** - Don't leave it for the end
7. **Use ICU format** - For complex messages
8. **Automate extraction** - Keep translations in sync

## Integration with Other Skills

- **content-creator**: Generate localized content
- **seo**: Multi-language SEO optimization
- **react-expert**: Component patterns for i18n
- **multi-agent-patterns**: Parallel translation generation