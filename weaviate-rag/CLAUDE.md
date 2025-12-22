# Weaviate RAG - Agent Instructions

> Instructions for Claude Code agents working with the Weaviate RAG module.

## Overview

This module provides GPU-accelerated vector search for:
- **Code Intelligence** - Semantic search across codebases
- **Conversation Memory** - Persistent context from past sessions
- **Type Definitions** - TypeScript interface lookups

## Prerequisites

Before setup, verify:
```bash
# Docker running
docker ps

# GPU available (optional but recommended)
nvidia-smi

# Node.js 18+
node --version
```

## Setup Steps

### 1. Start Weaviate
```bash
docker compose up -d
```

**Verify it's running:**
```bash
curl http://localhost:8080/v1/.well-known/ready
# Should return: {"status":"OK"}
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Discover and Index Projects
```bash
# Auto-discover projects in /root
node scripts/discover-projects.js

# Index all discovered projects
node scripts/auto-index.js

# Or index specific project
node scripts/auto-index.js --project matwal-premium
```

### 4. Start MCP Server
```bash
node src/mcp-server.js
```

### 5. Add to Claude Code Config

Edit `~/.claude/mcp.json`:
```json
{
  "weaviate-rag": {
    "command": "node",
    "args": ["/root/claude-toolkit/weaviate-rag/src/mcp-server.js"]
  }
}
```

---

## MCP Tools Reference

### `weaviate_search`
Hybrid semantic + keyword search for code.

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `query` | string | required | Natural language search |
| `alpha` | number | 0.5 | 0=keyword, 1=semantic |
| `limit` | number | 10 | Max results |
| `project` | string | null | Filter by project |
| `chunkTypes` | array | null | Filter: function, component, hook, service, class |

**Example:**
```javascript
weaviate_search({
  query: "authentication login user session",
  alpha: 0.7,
  project: "matwal-premium",
  chunkTypes: ["service", "hook"]
})
```

### `weaviate_context`
Build full context for a file (imports, dependencies, types).

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `filePath` | string | required | Relative path to file |
| `project` | string | "matwal-premium" | Project name |
| `includeTypes` | boolean | true | Include type definitions |
| `maxFiles` | number | 10 | Max related files |

**Example:**
```javascript
weaviate_context({
  filePath: "src/services/crmService.ts",
  includeTypes: true,
  maxFiles: 15
})
```

### `weaviate_types`
Search TypeScript type definitions.

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `query` | string | required | Type name or description |
| `project` | string | null | Filter by project |
| `limit` | number | 10 | Max results |

**Example:**
```javascript
weaviate_types({ query: "User interface profile" })
```

### `weaviate_similar`
Find code similar to a snippet.

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `code` | string | required | Code snippet |
| `project` | string | null | Filter by project |
| `limit` | number | 5 | Max results |

**Example:**
```javascript
weaviate_similar({
  code: "const handleSubmit = async (data) => { await supabase.from('users').insert(data) }"
})
```

### `weaviate_memories`
Search past conversation sessions.

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `query` | string | required | What to search for |
| `project` | string | null | Filter by project |
| `limit` | number | 5 | Max results |

**Example:**
```javascript
weaviate_memories({
  query: "RLS policy discussion supabase",
  project: "matwal-premium"
})
```

### `weaviate_status`
Check index status and health.

**Example:**
```javascript
weaviate_status({})
```

---

## Common Workflows

### Before Modifying a File
1. Get context: `weaviate_context({ filePath: "..." })`
2. Understand dependencies before making changes

### Finding Where Something is Implemented
1. Search: `weaviate_search({ query: "..." })`
2. Review results and read relevant files

### Checking Past Decisions
1. Search memories: `weaviate_memories({ query: "..." })`
2. Reference past context in your response

### After Making Changes
1. Re-index: `node scripts/auto-index.js --project PROJECT`
2. Or let daemon handle it automatically

---

## Maintenance

### Re-index a Project
```bash
node scripts/auto-index.js --project matwal-premium
```

### Index Conversations
```bash
node scripts/conversation-indexer.js
```

### Start Background Daemon
```bash
node scripts/daemon.js start
```

### Check Daemon Status
```bash
node scripts/daemon.js status
```

### View Daemon Logs
```bash
tail -f /tmp/weaviate-rag-daemon.log
```

---

## Troubleshooting

### "Connection refused" to Weaviate
```bash
# Check if container is running
docker ps | grep weaviate

# Restart if needed
docker compose down && docker compose up -d
```

### "GPU not available"
```bash
# Check NVIDIA runtime
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi

# If fails, reconfigure Docker
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

### Empty Search Results
```bash
# Check if data is indexed
node -e "
const weaviate = require('weaviate-client');
(async () => {
  const client = await weaviate.connectToLocal();
  const result = await client.collections.get('CodeChunk').aggregate.overAll();
  console.log('Total chunks:', result.totalCount);
})();
"
```

---

## File Structure

```
weaviate-rag/
├── CLAUDE.md              # This file
├── docker-compose.yml     # Weaviate with GPU
├── package.json
├── src/
│   ├── mcp-server.js      # MCP server for Claude Code
│   ├── indexer.js         # Code indexer
│   └── memory.js          # Memory functions
├── scripts/
│   ├── discover-projects.js
│   ├── auto-index.js
│   ├── conversation-indexer.js
│   └── daemon.js
└── config/
    └── projects.json      # Discovered projects
```
