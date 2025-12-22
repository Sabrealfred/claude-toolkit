# Claude Toolkit SaaS - Product Roadmap

## Vision: AI Agent Orchestration Platform

Turn Claude Toolkit into a SaaS product like Coupler.io, but for **AI agent orchestration** instead of data integration.

**Target:** marsala.dev or similar domain

---

## Current State vs Target

| Component | Current | Target SaaS |
|-----------|---------|-------------|
| Skills | 24 markdown files | Web-configurable skill library |
| API Connectors | Local JS files | Cloud-managed credentials vault |
| Agent Swarm | CLI script | Visual workflow builder |
| Model Finder | CLI tool | Smart model routing API |
| Authentication | None | OAuth, API keys, team management |
| Billing | None | Stripe subscriptions |
| Dashboard | None | React web app |

---

## Phase 1: MVP (4-6 weeks)

### 1.1 Backend API
```
/api/v1/
├── /auth
│   ├── POST /register
│   ├── POST /login
│   ├── POST /logout
│   └── GET /me
├── /skills
│   ├── GET /list
│   ├── GET /:id
│   └── POST /execute
├── /credentials
│   ├── GET /services
│   ├── POST /connect/:service
│   └── DELETE /disconnect/:service
├── /agents
│   ├── POST /run
│   ├── POST /swarm
│   └── GET /history
└── /billing
    ├── GET /plans
    ├── POST /subscribe
    └── GET /usage
```

**Tech Stack:**
- Runtime: Node.js / Bun
- Framework: Hono or Express
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- Queue: Supabase Edge Functions or BullMQ

### 1.2 Database Schema
```sql
-- Users & Auth (via Supabase Auth)

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Team Members
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT DEFAULT 'member',
  PRIMARY KEY (team_id, user_id)
);

-- Credentials Vault (encrypted)
CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  service TEXT NOT NULL,
  account_name TEXT NOT NULL,
  encrypted_data TEXT NOT NULL, -- AES-256 encrypted
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, service, account_name)
);

-- Agent Runs
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES auth.users(id),
  skill TEXT,
  model TEXT,
  prompt TEXT,
  result JSONB,
  tokens_used INTEGER,
  cost_usd NUMERIC(10,6),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Usage & Billing
CREATE TABLE usage (
  team_id UUID REFERENCES teams(id),
  month DATE NOT NULL,
  runs INTEGER DEFAULT 0,
  tokens INTEGER DEFAULT 0,
  cost_usd NUMERIC(10,2) DEFAULT 0,
  PRIMARY KEY (team_id, month)
);
```

### 1.3 Frontend Dashboard
```
/src/pages/
├── /auth
│   ├── Login.tsx
│   ├── Register.tsx
│   └── ForgotPassword.tsx
├── /dashboard
│   ├── Overview.tsx       # Stats, recent runs
│   ├── Skills.tsx         # Browse/run skills
│   ├── Credentials.tsx    # Manage API keys
│   ├── Agents.tsx         # Run agents/swarms
│   ├── History.tsx        # Past runs & results
│   └── Settings.tsx       # Team, billing
└── /public
    ├── Landing.tsx        # Marketing page
    ├── Pricing.tsx        # Plans comparison
    └── Docs.tsx           # Documentation
```

**Tech Stack:**
- Framework: React + Vite
- UI: shadcn/ui + Tailwind
- State: React Query + Zustand
- Auth: Supabase Auth

---

## Phase 2: Growth Features (2-3 months)

### 2.1 Workflow Builder (Visual)
- Drag-and-drop agent orchestration
- Connect skills in sequence
- Conditional logic (if/then)
- Loop over data

### 2.2 Scheduled Runs
- Cron-like scheduling
- Webhook triggers
- Event-based (on new data)

### 2.3 Integrations Marketplace
- Community skills
- Custom skill upload
- Private team skills

### 2.4 API for Developers
```bash
# Public API
curl -X POST https://api.marsala.dev/v1/agents/run \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"skill": "react-expert", "prompt": "..."}'
```

---

## Pricing Tiers (Similar to Coupler.io)

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0/mo | 100 runs/mo, 1 user, 3 skills |
| **Starter** | $29/mo | 1,000 runs/mo, 3 users, all skills |
| **Pro** | $99/mo | 10,000 runs/mo, 10 users, priority models |
| **Business** | $299/mo | Unlimited runs, SSO, dedicated support |
| **Enterprise** | Custom | On-prem, SLA, custom models |

**Billing Model:**
- Base subscription + overage
- Token usage tracking
- Model cost pass-through (optional)

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| **Frontend** | React + Vite + shadcn/ui |
| **Backend** | Node.js + Hono/Express |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Queue** | Supabase Edge Functions / BullMQ |
| **Storage** | Supabase Storage |
| **Payments** | Stripe |
| **Hosting** | Vercel (frontend) + Railway/Fly.io (backend) |
| **AI** | OpenRouter (multi-model) |

---

## MVP Checklist

### Week 1-2: Backend Core
- [ ] Supabase project setup
- [ ] Database schema migration
- [ ] Auth endpoints (register, login, OAuth)
- [ ] Basic CRUD for credentials
- [ ] Agent run endpoint

### Week 3-4: Frontend Core
- [ ] Landing page
- [ ] Auth pages (login, register)
- [ ] Dashboard layout
- [ ] Skills browser
- [ ] Credentials manager
- [ ] Agent runner UI

### Week 5-6: Polish & Launch
- [ ] Stripe integration
- [ ] Usage tracking
- [ ] Documentation
- [ ] Error handling
- [ ] Rate limiting
- [ ] Beta launch

---

## Differentiators vs Coupler.io

| Coupler.io | Marsala.dev (Claude Toolkit) |
|------------|------------------------------|
| Data integration | AI agent orchestration |
| 410 connectors | 30+ skills + custom |
| Spreadsheet focus | Code/dev focus |
| No AI | AI-first (multi-model) |
| Fixed workflows | Dynamic agent reasoning |

---

## Revenue Projections

**Assumptions:**
- 1% free → paid conversion
- $50 avg monthly revenue per paid user
- 10% monthly churn

| Month | Free Users | Paid Users | MRR |
|-------|------------|------------|-----|
| 1 | 100 | 1 | $50 |
| 3 | 500 | 10 | $500 |
| 6 | 2,000 | 50 | $2,500 |
| 12 | 10,000 | 200 | $10,000 |

---

## Next Steps

1. **Validate demand** - Landing page + waitlist
2. **Build MVP** - 6 week sprint
3. **Beta launch** - Free tier + feedback
4. **Iterate** - Based on usage data
5. **Growth** - Content marketing, integrations

---

## Resources Needed

| Resource | Cost/Month | Notes |
|----------|------------|-------|
| Supabase | $25 | Pro plan |
| Vercel | $20 | Pro plan |
| Railway/Fly | $20 | Backend hosting |
| OpenRouter | Variable | Pass-through to users |
| Stripe | 2.9% + $0.30 | Per transaction |
| Domain | $15/year | marsala.dev |
| **Total Fixed** | ~$70/mo | Before AI costs |
