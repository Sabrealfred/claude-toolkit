---
name: rapid-deploy
description: Full-stack rapid deployment expert (Lovable-style). Creates projects, deploys to Netlify/Vercel, connects Supabase, GitHub, DNS, domains, and email in one flow.
---

# Rapid Deploy Skill (Lovable-Style)

One-command full-stack deployment: Create → Build → Deploy → Configure DNS → Done.

## Quick Start Checklist

```
[ ] Node/npm installed
[ ] GitHub CLI authenticated (gh auth login)
[ ] Netlify CLI authenticated (netlify login)
[ ] Supabase CLI linked (supabase login)
[ ] Domain registrar access (Cloudflare/Namecheap/etc)
```

## Full Deployment Flow

### Step 1: Create Project

```bash
# Create Vite + React + TypeScript project
npm create vite@latest my-app -- --template react-ts
cd my-app

# Install dependencies
npm install

# Add essential packages
npm install @supabase/supabase-js @tanstack/react-query react-router-dom
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p
```

### Step 2: Setup Supabase

```bash
# Initialize Supabase in project
npx supabase init

# Link to existing project OR create new
npx supabase link --project-ref YOUR_PROJECT_REF

# OR create new project
npx supabase projects create "my-app" --org-id YOUR_ORG_ID
```

**Quick Supabase Config:**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Step 3: GitHub Repository

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit"

# Create GitHub repo and push
gh repo create my-app --public --source=. --push

# Set up branch protection (optional)
gh api repos/USERNAME/my-app/branches/main/protection -X PUT \
  -F required_status_checks='{"strict":true,"contexts":[]}' \
  -F enforce_admins=false \
  -F required_pull_request_reviews='{"required_approving_review_count":1}'
```

### Step 4: Deploy to Netlify

```bash
# Login to Netlify
netlify login

# Create new site
netlify sites:create --name my-app-unique-name

# Link to site
netlify link

# Set environment variables
netlify env:set VITE_SUPABASE_URL "https://xxx.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key"

# Deploy (preview)
npm run build
netlify deploy --dir=dist

# Deploy (production)
netlify deploy --prod --dir=dist
```

### Step 5: Connect Custom Domain

```bash
# Add domain to Netlify
netlify domains:add myapp.com

# Get DNS records needed
netlify dns:records myapp.com
```

**DNS Configuration (at your registrar):**

| Type | Name | Value |
|------|------|-------|
| A | @ | 75.2.60.5 |
| CNAME | www | my-app-unique-name.netlify.app |
| TXT | @ | netlify=site-id (for verification) |

### Step 6: SSL Certificate

```bash
# Netlify auto-provisions SSL, but you can check:
netlify api getSite --data '{"site_id":"YOUR_SITE_ID"}' | jq '.ssl'

# Force HTTPS
# Add to netlify.toml:
[[redirects]]
  from = "http://myapp.com/*"
  to = "https://myapp.com/:splat"
  status = 301
  force = true
```

### Step 7: Setup Email (Optional)

**Option A: Resend (Recommended)**
```bash
npm install resend

# Set API key
netlify env:set RESEND_API_KEY "re_xxx"
```

```typescript
// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  return resend.emails.send({
    from: 'noreply@myapp.com',
    to,
    subject,
    html,
  });
}
```

**Option B: Supabase Edge Function + SMTP**
```typescript
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { to, subject, body } = await req.json();

  // Use your SMTP provider
  // ...
});
```

**DNS for Email (if using custom domain):**

| Type | Name | Value |
|------|------|-------|
| MX | @ | mx1.resend.com (priority 10) |
| TXT | @ | v=spf1 include:_spf.resend.com ~all |
| TXT | resend._domainkey | DKIM record from Resend dashboard |

## One-Command Deploy Script

```bash
#!/bin/bash
# deploy.sh - Full deployment script

PROJECT_NAME=$1
DOMAIN=$2

if [ -z "$PROJECT_NAME" ]; then
  echo "Usage: ./deploy.sh <project-name> [domain]"
  exit 1
fi

echo "Creating project: $PROJECT_NAME"

# 1. Create project
npm create vite@latest $PROJECT_NAME -- --template react-ts
cd $PROJECT_NAME

# 2. Install dependencies
npm install
npm install @supabase/supabase-js @tanstack/react-query react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 3. Git setup
git init
git add .
git commit -m "Initial commit"

# 4. GitHub repo
gh repo create $PROJECT_NAME --public --source=. --push

# 5. Netlify setup
netlify sites:create --name $PROJECT_NAME
netlify link

# 6. Build and deploy
npm run build
netlify deploy --prod --dir=dist

# 7. Custom domain (if provided)
if [ -n "$DOMAIN" ]; then
  netlify domains:add $DOMAIN
  echo "Add these DNS records at your registrar:"
  echo "A     @     75.2.60.5"
  echo "CNAME www   $PROJECT_NAME.netlify.app"
fi

echo "Deployment complete!"
echo "Site URL: https://$PROJECT_NAME.netlify.app"
```

## Vercel Alternative

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (interactive)
vercel

# Deploy production
vercel --prod

# Add domain
vercel domains add myapp.com

# Set env vars
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

## Project Templates

### Minimal React + Supabase

```bash
# Clone template
npx degit user/supabase-react-template my-app
cd my-app
npm install

# Configure
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Deploy
npm run build
netlify deploy --prod --dir=dist
```

### Full-Stack with Auth

```
my-app/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── ui/
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   └── supabase.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   └── Dashboard.tsx
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   └── migrations/
├── .env.local
├── netlify.toml
└── package.json
```

### netlify.toml Configuration

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

## CI/CD with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Cloudflare DNS Setup

```bash
# If using Cloudflare for DNS

# 1. Add site to Cloudflare
# 2. Update nameservers at registrar
# 3. Add DNS records:

# For Netlify:
# Type: CNAME
# Name: @
# Target: my-app.netlify.app
# Proxy status: DNS only (gray cloud)

# For www:
# Type: CNAME
# Name: www
# Target: my-app.netlify.app
# Proxy status: DNS only

# 4. Set SSL mode to "Full (strict)" in Cloudflare
```

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check `npm run build` locally first |
| 404 on routes | Add SPA redirect in netlify.toml |
| Env vars not working | Prefix with `VITE_` for client-side |
| DNS not propagating | Wait 24-48h, check with `dig` |
| SSL not working | Verify DNS records, wait for provisioning |
| CORS errors | Check Supabase URL config, add to allowed origins |

## Domain Registrar Quick Links

- **Cloudflare**: cloudflare.com/dns
- **Namecheap**: namecheap.com → Domain List → Manage
- **GoDaddy**: dcc.godaddy.com → DNS
- **Google Domains**: domains.google.com

## Integration with Other Skills

- **devops**: Advanced deployment configurations
- **supabase-expert**: Database setup and migrations
- **security-audit**: SSL and security headers
- **auth-specialist**: Authentication setup
- **theming-darkmode**: UI theming for deployed site