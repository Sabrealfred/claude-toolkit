# Claude Code Extensions - Version Registry

**Last Updated:** 2025-12-19

## Version Convention

Format: `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes
- MINOR: New features, backward compatible
- PATCH: Bug fixes

---

## API Connectors

| Component | Version | Last Updated | Description |
|-----------|---------|--------------|-------------|
| `api-registry.js` | 1.0.0 | 2025-12-19 | Unified credential management with multi-account support |
| `api-client.js` | 1.0.0 | 2025-12-19 | Standalone HTTP client for API calls |
| `openrouter-agent.js` | 1.0.0 | 2025-12-19 | OpenRouter agent with tool calling |
| `agent-swarm.js` | 1.0.0 | 2025-12-19 | Parallel agent orchestration |
| `model-finder.js` | 1.0.0 | 2025-12-19 | Model discovery and routing |

---

## MCP Servers

| MCP | Status | Description |
|-----|--------|-------------|
| `magic` | Active | UI component generation (21st.dev) |
| `puppeteer-mcp-claude` | Active | Browser automation |
| `lmstudio-local` | Active | Local LM Studio bridge |
| `docker-mcp` | Active | Container management |
| `ai-orchestrator` | Active | Multi-model routing (LMStudio/Ollama/Codex) |
| `openrouter` | Active | OpenRouter API |
| `huggingface` | Active | Model search |
| `groq` | Active | Fast inference |
| `gemini` | Active | Google Gemini direct |
| `multi-agent` | Active | Parallel agent spawning |
| `orchestrator` | Active | Gemini with context |
| `codex-cli` | Active | OpenAI Codex CLI |
| `gdrive` | Active | Google Drive access |
| ~~`openrouter-extra`~~ | Removed | Duplicate of openrouter |

---

## Skills (Commands)

| Skill | Version | Category | Description |
|-------|---------|----------|-------------|
| `/devops` | 2.0.0 | Infrastructure | Cloud platforms, deployments, CI/CD |
| `/seo` | 2.0.0 | Marketing | SEO master (consolidated from 8 files) |
| `/legal` | 2.0.0 | Legal | Legal expert suite (consolidated from 8 files) |
| `/model-finder` | 1.0.0 | AI | Model discovery and routing |
| `/agent-swarm` | 1.0.0 | AI | Parallel agent orchestration |
| `/react-expert` | 1.0.0 | Development | React + Vite + TypeScript |
| `/supabase-expert` | 1.0.0 | Database | Supabase operations |
| `/security-audit` | 1.0.0 | Security | Code security scanning |
| `/auth-specialist` | 1.0.0 | Auth | Authentication debugging |
| `/webapp-testing` | 1.0.0 | Testing | Playwright testing |
| `/content-creator` | 1.0.0 | Content | Blog/article generation |
| `/quant-developer` | 1.0.0 | Trading | Algorithmic trading |
| `/crypto-trading` | 1.0.0 | Trading | Cryptocurrency bots |
| `/ui-designer` | 1.0.0 | Design | UI/UX with Magic MCP |
| `/bi-dashboard` | 1.0.0 | Analytics | Business intelligence |
| `/data-integration` | 1.0.0 | Data | ETL/ELT pipelines |
| `/ma-pipeline` | 1.0.0 | M&A | Due diligence automation |
| `/rapid-deploy` | 1.0.0 | Deploy | Full-stack rapid deployment |
| `/i18n-multilang` | 1.0.0 | i18n | Internationalization |
| `/theming-darkmode` | 1.0.0 | UI | Theme systems |
| `/dummy-data` | 1.0.0 | Data | Test data generation |
| `/multi-agent-patterns` | 1.0.0 | AI | Agent orchestration patterns |
| `/skill-updater` | 1.0.0 | Meta | Self-learning skill updates |
| `/weekly-refresh` | 1.0.0 | Meta | Weekly skill refresh |

---

## Archive Structure

```
/root/claude-summaries/_archive/
├── skills/              # Archived/deprecated skills
│   ├── seo-ai.md        # Merged into /seo
│   ├── seo-audit.md
│   ├── seo-gtm-setup.md
│   ├── seo-learn.md
│   ├── seo-lighthouse.md
│   ├── seo-search-console.md
│   ├── seo-sitemap.md
│   ├── legal-analyst.md  # Merged into /legal
│   ├── legal-compare.md
│   ├── legal-contract.md
│   ├── legal-draft.md
│   ├── legal-duediligence.md
│   ├── legal-qa.md
│   ├── legal-realestate.md
│   └── devops-infra.md   # Merged into /devops
├── api-connectors/      # Archived connector versions
│   ├── api-client.ts    # Duplicate of .js
│   ├── connectors.ts    # Duplicate of .json
│   ├── examples.js      # Old examples
│   └── CONNECTORS.md    # Duplicate of README
├── mcps/               # Archived MCP configs
└── versions/           # Historical versions
```

---

## Changelog

### 2025-12-19 - Consolidation Release

**Removed:**
- `openrouter-extra` MCP (duplicate)
- 7 SEO sub-skills (merged into `/seo`)
- 7 Legal sub-skills (merged into `/legal`)
- `devops-infra.md` (merged into `/devops`)
- Duplicate API connector files

**Added:**
- `openrouter-agent.js` - Tool calling with OpenRouter
- `agent-swarm.js` - Parallel agent orchestration
- `model-finder.js` - Model discovery and routing
- VERSION.md - This file

**Updated:**
- `/devops` - Added API registry section
- Archive structure created

---

## How to Update

When modifying components:

1. **Increment version** in this file
2. **Add changelog entry** with date
3. **Archive old version** if major change:
   ```bash
   cp file.js _archive/versions/file.v1.0.0.js
   ```

## File Counts

| Category | Count |
|----------|-------|
| Skills | 24 |
| MCPs | 13 |
| API Connectors | 5 |
| Archived | 19 |
