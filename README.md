# Claude Toolkit

> Extensible toolkit for Claude Code with skills, agent orchestration, and API connectors.

## Overview

Claude Toolkit is a collection of reusable components that enhance Claude Code with:

- **Skills** - Slash commands that give Claude domain expertise (DevOps, SEO, Legal, etc.)
- **API Connectors** - Unified credential management with multi-account support
- **Agent Orchestration** - Run parallel agent swarms with tool-calling capabilities
- **Model Finder** - Intelligent model routing across HuggingFace, Ollama, OpenRouter, Groq

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/claude-toolkit.git
cd claude-toolkit
```

### 2. Install skills

Copy skills to your Claude Code commands directory:

```bash
mkdir -p ~/.claude/commands
cp skills/*.md ~/.claude/commands/
```

### 3. Configure API credentials

```bash
cd api-connectors
cp credentials.template.js credentials.local.js
# Edit credentials.local.js with your API keys
```

### 4. Use the tools

```javascript
const { getClient } = require('./api-connectors/api-registry');

// Get a configured client
const openrouter = getClient('openrouter');
const supabase = getClient('supabase');

// Switch accounts (like gcloud)
const { setAccount } = require('./api-connectors/api-registry');
setAccount('google', 'work-account');
```

## Components

### Skills (`/skills`)

| Skill | Description |
|-------|-------------|
| `/devops` | Cloud platforms (gcloud, AWS, Netlify), Docker, Supabase |
| `/agent-swarm` | Parallel agent orchestration |
| `/model-finder` | Find best model for tasks |
| `/react-expert` | React + Vite + TypeScript + shadcn/ui |
| `/supabase-expert` | Database, RLS policies, migrations |
| `/security-audit` | Code security scanning |
| `/auth-specialist` | Authentication debugging |
| `/webapp-testing` | Playwright E2E testing |
| `/content-creator` | Blog/article generation |
| `/quant-developer` | Algorithmic trading (QuantConnect) |
| `/crypto-trading` | Crypto bots (Freqtrade) |
| `/ui-designer` | UI/UX with Magic MCP |
| `/bi-dashboard` | Business intelligence dashboards |
| `/data-integration` | ETL/ELT pipelines |
| `/ma-pipeline` | M&A due diligence automation |
| `/rapid-deploy` | Full-stack rapid deployment |
| `/i18n-multilang` | Internationalization |
| `/theming-darkmode` | Theme systems |
| `/dummy-data` | Test data generation |
| `/seo` | SEO + AI discoverability |
| `/legal` | Legal document analysis |
| `/multi-agent-patterns` | Agent orchestration patterns |
| `/skill-updater` | Self-learning skill updates |
| `/weekly-refresh` | Weekly skill refresh |

### API Connectors (`/api-connectors`)

Multi-account credential management inspired by `gcloud auth`:

```javascript
const { getClient, listServices, setAccount } = require('./api-registry');

// List configured services
listServices();
// { configured: ['openrouter', 'supabase', ...], notConfigured: [...] }

// Get client (uses default account)
const client = getClient('openrouter');

// Switch to different account
setAccount('google', 'personal-account');
const googleClient = getClient('google');
```

**Supported services:**
- AI: OpenRouter, Anthropic, OpenAI, Gemini, Groq
- Cloud: Google Cloud, AWS, Azure, Cloudflare
- Database: Supabase
- Email: Resend, SendGrid
- Productivity: Asana, Notion, Slack, GitHub, Linear
- Payments: Stripe
- Analytics: Umami

### Agent Orchestration

#### OpenRouter Agent (`openrouter-agent.js`)

Tool-calling agent using OpenRouter models:

```javascript
const { OpenRouterAgent } = require('./openrouter-agent');

const agent = new OpenRouterAgent({
  model: 'anthropic/claude-sonnet-4',
  tools: ['read_file', 'write_file', 'search_code', 'run_command']
});

const result = await agent.run('Find all TODO comments and create a summary');
```

#### Agent Swarm (`agent-swarm.js`)

Run multiple agents in parallel:

```javascript
const { runSwarm, PRESET_SWARMS } = require('./agent-swarm');

// Run a preset swarm
const results = await runSwarm({
  ...PRESET_SWARMS.codeReviewSwarm,
  path: './src'
});

// Custom swarm
const results = await runSwarm({
  tasks: [
    { id: '1', prompt: 'Review auth flow', files: ['src/auth/*'] },
    { id: '2', prompt: 'Check database queries', files: ['src/db/*'] },
    { id: '3', prompt: 'Audit API security', files: ['src/api/*'] },
  ],
  model: 'anthropic/claude-sonnet-4',
  concurrency: 3
});
```

### Model Finder (`model-finder.js`)

Find the best model for your task:

```javascript
const { findModel } = require('./model-finder');

const recommendation = await findModel('image analysis and OCR', {
  checkLocal: true,   // Check Ollama
  providers: ['huggingface', 'ollama', 'openrouter', 'groq']
});

// Returns:
// {
//   taskCategory: 'vision',
//   bestChoice: {
//     model: 'llama3.2-vision:latest',
//     provider: 'ollama',
//     reason: 'Local, free, good for vision tasks',
//     command: 'ollama run llama3.2-vision:latest'
//   },
//   alternatives: [...]
// }
```

## Directory Structure

```
claude-toolkit/
├── api-connectors/
│   ├── api-registry.js        # Unified credential manager
│   ├── api-client.js          # HTTP client
│   ├── openrouter-agent.js    # Tool-calling agent
│   ├── agent-swarm.js         # Parallel orchestration
│   ├── model-finder.js        # Model routing
│   ├── credentials.template.js # Template (fill with your keys)
│   └── connectors.json        # Service configurations
├── skills/
│   ├── devops.md
│   ├── react-expert.md
│   └── ... (24 skills)
├── docs/
│   └── VERSION.md             # Version registry
├── examples/
└── templates/
```

## Required Tools Stack

### Core Requirements

| Tool | Version | Install | Purpose |
|------|---------|---------|---------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) | Runtime |
| **Claude Code** | Latest | `npm install -g @anthropic-ai/claude-code` | AI assistant CLI |

### Cloud CLIs (Install based on your needs)

| Service | CLI | Install Command | Docs |
|---------|-----|-----------------|------|
| **Google Cloud** | `gcloud` | `curl https://sdk.cloud.google.com \| bash` | [cloud.google.com/sdk](https://cloud.google.com/sdk) |
| **AWS** | `aws` | `pip install awscli` or [installer](https://aws.amazon.com/cli/) | [aws.amazon.com/cli](https://aws.amazon.com/cli/) |
| **Azure** | `az` | `curl -sL https://aka.ms/InstallAzureCLIDeb \| sudo bash` | [docs.microsoft.com/cli/azure](https://docs.microsoft.com/cli/azure/) |
| **Supabase** | `supabase` | `npm install -g supabase` | [supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli) |
| **Netlify** | `netlify` | `npm install -g netlify-cli` | [docs.netlify.com/cli](https://docs.netlify.com/cli/) |
| **Cloudflare** | `wrangler` | `npm install -g wrangler` | [developers.cloudflare.com/workers/wrangler](https://developers.cloudflare.com/workers/wrangler/) |
| **Vercel** | `vercel` | `npm install -g vercel` | [vercel.com/docs/cli](https://vercel.com/docs/cli) |

### DevOps Tools

| Tool | Install Command | Purpose |
|------|-----------------|---------|
| **Docker** | [docker.com/get-docker](https://docker.com/get-docker) | Containers |
| **Docker Compose** | Included with Docker Desktop | Multi-container orchestration |
| **GitHub CLI** | `brew install gh` or [cli.github.com](https://cli.github.com) | GitHub operations |

### AI/ML Tools (Local Models)

| Tool | Install Command | Purpose |
|------|-----------------|---------|
| **Ollama** | `curl -fsSL https://ollama.com/install.sh \| sh` | Local LLM inference |
| **LM Studio** | [lmstudio.ai](https://lmstudio.ai) | Local model GUI |

### AI SDKs (npm packages)

```bash
# Install AI provider SDKs
npm install openai           # OpenAI/GPT
npm install @anthropic-ai/sdk # Anthropic/Claude
npm install @google/generative-ai # Google Gemini
npm install groq-sdk         # Groq (fast inference)
```

### Database Tools

| Tool | Install | Purpose |
|------|---------|---------|
| **psql** | `apt install postgresql-client` | PostgreSQL CLI |
| **Supabase CLI** | `npm install -g supabase` | Database migrations, edge functions |

### Optional: Trading/Quant Tools

| Tool | Install | Purpose |
|------|---------|---------|
| **LEAN CLI** | `pip install lean` | QuantConnect algorithmic trading |
| **Freqtrade** | `pip install freqtrade` | Crypto trading bot |

### Quick Install Script

```bash
#!/bin/bash
# Install core tools for Claude Toolkit

# Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Claude Code
npm install -g @anthropic-ai/claude-code

# Cloud CLIs
npm install -g supabase netlify-cli wrangler vercel

# GitHub CLI
brew install gh || (curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null && sudo apt update && sudo apt install gh -y)

# Ollama (local models)
curl -fsSL https://ollama.com/install.sh | sh

# AI SDKs
npm install openai @anthropic-ai/sdk @google/generative-ai groq-sdk

echo "Core tools installed!"
```

### Verify Installation

```bash
# Check installed tools
node --version           # Should be 18+
claude --version         # Claude Code
gcloud --version         # Google Cloud (optional)
aws --version           # AWS (optional)
az --version            # Azure (optional)
supabase --version      # Supabase
netlify --version       # Netlify
docker --version        # Docker
gh --version            # GitHub CLI
ollama --version        # Ollama (optional)
```

## Service-Specific Setup

### Google Cloud
```bash
gcloud auth login
gcloud auth application-default login  # For API access
gcloud config set project YOUR_PROJECT_ID
```

### AWS
```bash
aws configure
# Enter: Access Key ID, Secret Access Key, Region
```

### Azure
```bash
az login
az account set --subscription YOUR_SUBSCRIPTION_ID
```

### Supabase
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### GitHub
```bash
gh auth login
```

### Ollama (Local Models)
```bash
# Install a model
ollama pull llama3.2
ollama pull codellama
ollama pull llama3.2-vision  # For image analysis

# List models
ollama list
```

## Frameworks & Libraries by Skill

Each skill may require specific frameworks. Install based on your project needs.

### `/react-expert` - Frontend Development

```bash
# Core
npm install react react-dom vite typescript

# UI Components (shadcn/ui)
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input dialog

# Styling
npm install tailwindcss postcss autoprefixer
npm install clsx tailwind-merge class-variance-authority

# State & Data
npm install @tanstack/react-query zustand
npm install react-hook-form zod @hookform/resolvers

# Routing
npm install react-router-dom
```

### `/supabase-expert` - Database & Auth

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install @supabase/auth-helpers-react  # Optional auth helpers
```

### `/security-audit` - Security Scanning

```bash
# ESLint security plugins
npm install -D eslint-plugin-security eslint-plugin-no-secrets

# Dependency audit
npm audit
npx snyk test  # Requires snyk CLI
```

### `/webapp-testing` - E2E Testing

```bash
# Playwright
npm install -D @playwright/test
npx playwright install  # Install browsers

# Vitest (unit tests)
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### `/ui-designer` - UI/UX Components

```bash
# Component Libraries
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install framer-motion  # Animations
npm install lucide-react   # Icons

# Magic MCP (21st.dev) - requires MCP server
# Provides AI-powered component generation
```

### `/bi-dashboard` - Business Intelligence

```bash
# Charts & Visualization
npm install recharts tremor @tremor/react
npm install @tanstack/react-table  # Data tables

# Alternative: Apache Superset (Python)
pip install apache-superset
```

### `/data-integration` - ETL/ELT

```bash
# n8n (workflow automation)
npm install -g n8n
n8n start

# Airbyte (data pipelines)
# Docker-based: https://docs.airbyte.com/deploying-airbyte/local-deployment
docker compose -f docker-compose.yaml up
```

### `/i18n-multilang` - Internationalization

```bash
npm install i18next react-i18next i18next-browser-languagedetector
npm install i18next-http-backend  # Load translations from server
```

### `/theming-darkmode` - Theme Systems

```bash
npm install next-themes  # For Next.js
# Or use Tailwind's built-in dark mode:
# tailwind.config.js: darkMode: 'class'
```

### `/seo` - Search Engine Optimization

```bash
# Next.js
npm install next-seo

# React (Vite/CRA)
npm install react-helmet-async

# Sitemap generation
npm install sitemap
```

### `/quant-developer` - Algorithmic Trading

```bash
# QuantConnect LEAN
pip install lean

# Initialize project
lean init

# Backtest
lean backtest "My Strategy"
```

### `/crypto-trading` - Cryptocurrency Bots

```bash
# Freqtrade
pip install freqtrade

# Create user directory
freqtrade create-userdir --userdir user_data

# CCXT (exchange connectivity)
pip install ccxt
# or
npm install ccxt
```

### `/content-creator` - Content Generation

```bash
# Markdown processing
npm install marked gray-matter

# Rich text editing
npm install @tiptap/react @tiptap/starter-kit
npm install lexical @lexical/react
```

### `/auth-specialist` - Authentication

```bash
# Supabase Auth
npm install @supabase/supabase-js @supabase/ssr

# Alternative: NextAuth.js
npm install next-auth

# Alternative: Clerk
npm install @clerk/nextjs
```

### `/rapid-deploy` - Deployment

```bash
# Netlify
npm install -g netlify-cli

# Vercel
npm install -g vercel

# Docker
# Already covered in DevOps Tools section
```

## Quick Reference: Common Stacks

### Modern React Stack (Recommended)
```bash
# Create project
npm create vite@latest my-app -- --template react-ts
cd my-app

# Install essentials
npm install @tanstack/react-query zustand react-router-dom
npm install @supabase/supabase-js
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

# shadcn/ui
npx shadcn-ui@latest init
```

### Full-Stack with Supabase
```bash
# Frontend
npm create vite@latest frontend -- --template react-ts

# Supabase (local dev)
supabase init
supabase start

# Deploy
supabase link --project-ref YOUR_REF
supabase db push
```

### Trading Bot Stack
```bash
# Python environment
python -m venv venv
source venv/bin/activate

# Freqtrade
pip install freqtrade
freqtrade create-userdir

# Or QuantConnect
pip install lean
lean init
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your skill or connector
4. Update VERSION.md
5. Submit a pull request

## License

MIT

## Credits

Built with Claude Code by the community.
