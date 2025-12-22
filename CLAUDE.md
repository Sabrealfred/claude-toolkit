# Claude Code Agent Instructions

> This file provides setup and usage instructions for Claude Code agents working with this toolkit.

## Quick Setup for Agents

When a user asks you to set up claude-toolkit, follow these steps:

### 1. Clone the Repository
```bash
git clone https://github.com/Marsala-dev/claude-toolkit.git
cd claude-toolkit
```

### 2. Install Skills (Slash Commands)
```bash
mkdir -p ~/.claude/commands
cp skills/*.md ~/.claude/commands/
```

After this, the user will have access to these slash commands:
- `/devops` - Cloud deployments, Docker, infrastructure
- `/react-expert` - React + Vite + TypeScript + shadcn/ui
- `/supabase-expert` - Database, RLS policies, migrations
- `/security-audit` - Code security scanning
- `/ui-designer` - UI/UX with Magic MCP
- `/content-creator` - Blog/article generation
- And 18+ more skills

### 3. Set Up Weaviate RAG (Vector Search + Memory)

**Prerequisites:** Docker with GPU support (NVIDIA Container Toolkit)

```bash
cd weaviate-rag
docker compose up -d
npm install
```

**Index the codebase:**
```bash
node scripts/discover-projects.js  # Find projects
node scripts/auto-index.js         # Index them
```

**Start MCP server:**
```bash
node src/mcp-server.js
```

**Add to Claude Code MCP config** (`~/.claude/mcp.json`):
```json
{
  "weaviate-rag": {
    "command": "node",
    "args": ["/path/to/claude-toolkit/weaviate-rag/src/mcp-server.js"]
  }
}
```

### 4. Configure API Credentials
```bash
cd api-connectors
cp credentials.template.js credentials.local.js
# Edit credentials.local.js with API keys
```

---

## Available MCP Tools (After Weaviate Setup)

Once Weaviate RAG is running, you have these tools:

| Tool | Use When |
|------|----------|
| `weaviate_search` | User asks "where is X handled?" or "find code that does Y" |
| `weaviate_context` | You need full context for a file (imports, dependencies, types) |
| `weaviate_types` | Looking for TypeScript interfaces or type definitions |
| `weaviate_similar` | Finding similar code patterns or duplicates |
| `weaviate_memories` | Searching past conversation sessions for context |
| `weaviate_status` | Checking what's indexed and system health |

### Example Usage Patterns

**Finding code by meaning:**
```javascript
// User: "Where do we handle authentication?"
weaviate_search({ query: "user authentication login session", alpha: 0.7 })
```

**Getting full file context:**
```javascript
// Before modifying a service, understand its dependencies
weaviate_context({ filePath: "src/services/authService.ts", includeTypes: true })
```

**Searching past conversations:**
```javascript
// User: "What did we decide about the API structure?"
weaviate_memories({ query: "API structure architecture decision" })
```

---

## Skills Quick Reference

### When to Suggest Each Skill

| User Need | Suggest |
|-----------|---------|
| Deploy to cloud | `/devops` |
| React component issues | `/react-expert` |
| Database/Supabase | `/supabase-expert` |
| Security review | `/security-audit` |
| UI/UX design | `/ui-designer` |
| Auth problems | `/auth-specialist` |
| E2E testing | `/webapp-testing` |
| Content writing | `/content-creator` |
| Trading bot | `/quant-developer` or `/crypto-trading` |
| Data pipelines | `/data-integration` |
| Internationalization | `/i18n-multilang` |
| Dark mode/themes | `/theming-darkmode` |
| SEO | `/seo` |

---

## Agent Swarm (Parallel Agents)

For complex tasks, you can spawn multiple agents:

```javascript
const { runSwarm } = require('./api-connectors/agent-swarm');

// Run parallel code review
await runSwarm({
  tasks: [
    { id: '1', prompt: 'Review auth flow', files: ['src/auth/*'] },
    { id: '2', prompt: 'Check database queries', files: ['src/db/*'] },
    { id: '3', prompt: 'Audit API security', files: ['src/api/*'] },
  ],
  model: 'anthropic/claude-sonnet-4',
  concurrency: 3
});
```

---

## Troubleshooting

### Weaviate Not Starting
```bash
# Check if Docker is running
docker ps

# Check GPU availability
nvidia-smi

# View Weaviate logs
docker compose logs -f weaviate
```

### Skills Not Appearing
```bash
# Verify skills are in the right location
ls ~/.claude/commands/

# Re-copy if needed
cp /path/to/claude-toolkit/skills/*.md ~/.claude/commands/
```

### MCP Server Connection Issues
```bash
# Test the server manually
node weaviate-rag/src/mcp-server.js

# Check MCP config
cat ~/.claude/mcp.json
```

---

## Project Structure

```
claude-toolkit/
├── CLAUDE.md              # This file (agent instructions)
├── README.md              # Full documentation
├── api-connectors/        # API clients and credentials
├── weaviate-rag/          # Vector search and memory
│   ├── docker-compose.yml # GPU-enabled Weaviate
│   ├── src/mcp-server.js  # MCP server
│   └── scripts/           # Indexing tools
├── skills/                # Slash command definitions
└── docs/                  # Additional documentation
```

---

## Maintenance Tasks

### Re-index After Code Changes
```bash
cd weaviate-rag
node scripts/auto-index.js --project PROJECT_NAME
```

### Index New Conversations (Memory)
```bash
node scripts/conversation-indexer.js
```

### Start Background Daemon (Auto Re-index)
```bash
node scripts/daemon.js start
```

---

## Version Info

- **Repository:** https://github.com/Marsala-dev/claude-toolkit
- **Weaviate:** GPU-accelerated with MiniLM-L6 embeddings
- **Skills:** 24+ slash commands
- **Last Updated:** 2024-12
