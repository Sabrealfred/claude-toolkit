# Agent Swarm with OpenRouter Tools

Orchestrate multiple AI agents with tool-calling capabilities using OpenRouter.

## Key Files
```
/root/claude-summaries/api-connectors/
├── openrouter-agent.js   # Single agent with tools
├── agent-swarm.js        # Parallel swarm orchestrator
├── api-registry.js       # Credentials management
```

## Quick Start

### Single Agent with Tools
```javascript
const { createAgent } = require('/root/claude-summaries/api-connectors/openrouter-agent');

const agent = createAgent('openai/gpt-4o-mini');
const result = await agent.run('Read package.json and list all dependencies');
console.log(result.response);
```

### Run a Swarm (Parallel Agents)
```javascript
const { runSwarm } = require('/root/claude-summaries/api-connectors/agent-swarm');

const results = await runSwarm({
  tasks: [
    { id: 'bugs', prompt: 'Find bugs in src/components/' },
    { id: 'types', prompt: 'Check TypeScript errors in src/' },
    { id: 'todos', prompt: 'List all TODO comments in the codebase' },
  ],
  model: 'openai/gpt-4o-mini',
  concurrency: 5
});
```

## Available Tools

Each agent has access to these tools:

| Tool | Description |
|------|-------------|
| `read_file` | Read file contents |
| `write_file` | Write content to file |
| `edit_file` | Replace string in file |
| `list_files` | List directory contents |
| `search_code` | Grep for patterns |
| `run_command` | Execute safe shell commands |

## Tool-Capable Models

```javascript
const TOOL_CAPABLE_MODELS = [
  'openai/gpt-4-turbo',      // Best quality
  'openai/gpt-4o',           // Fast + good
  'openai/gpt-4o-mini',      // Cheap + fast (recommended for swarms)
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3-opus',
  'google/gemini-pro-1.5',
  'mistralai/mistral-large',
];
```

## Preset Swarms

### Code Review Swarm
```javascript
const { codeReviewSwarm } = require('/root/claude-summaries/api-connectors/agent-swarm');

// Runs 6 agents: bugs, security, performance, types, todos, imports
const results = await codeReviewSwarm('/root/my-project/src');
```

### Project Scan Swarm
```javascript
const { projectScanSwarm } = require('/root/claude-summaries/api-connectors/agent-swarm');

// Analyzes: structure, dependencies, readme, env, entry, tests, config
const results = await projectScanSwarm('/root/my-project');
```

### File Analysis Swarm
```javascript
const { fileAnalysisSwarm } = require('/root/claude-summaries/api-connectors/agent-swarm');

const files = [
  '/root/project/src/App.tsx',
  '/root/project/src/hooks/useAuth.ts',
  '/root/project/src/api/client.ts'
];

const results = await fileAnalysisSwarm(files, 'check for security vulnerabilities');
```

## Swarm Configuration Options

```javascript
await runSwarm({
  tasks: [...],              // Required: array of { id, prompt }
  model: 'openai/gpt-4o-mini', // Model to use
  concurrency: 5,            // Max parallel agents
  systemPrompt: '...',       // Custom system prompt for all agents
  verbose: true,             // Show progress
  onTaskComplete: (result) => {},  // Callback per task
  onTaskError: (error) => {}       // Error callback
});
```

## Example: Full Project Audit

```javascript
const { runSwarm } = require('/root/claude-summaries/api-connectors/agent-swarm');

const projectDir = '/root/matwal-premium';

const results = await runSwarm({
  tasks: [
    // Architecture
    { id: 'structure', prompt: `Analyze the folder structure of ${projectDir}/src` },

    // Code Quality
    { id: 'components', prompt: `Review ${projectDir}/src/components for React best practices` },
    { id: 'hooks', prompt: `Check ${projectDir}/src/hooks for proper hook patterns` },
    { id: 'api', prompt: `Review ${projectDir}/src/api for error handling` },

    // Security
    { id: 'security', prompt: `Search for security issues in ${projectDir}/src (XSS, injection)` },
    { id: 'secrets', prompt: `Check if any secrets are exposed in ${projectDir}/src` },

    // Build
    { id: 'deps', prompt: `Read ${projectDir}/package.json and check for outdated dependencies` },
    { id: 'config', prompt: `Review ${projectDir}/vite.config.ts for optimization opportunities` },
  ],
  model: 'openai/gpt-4o-mini',
  concurrency: 4,
  systemPrompt: 'You are a senior developer performing a code audit. Be specific with file paths and line numbers.'
});

// Process results
for (const r of results.results) {
  if (r.success) {
    console.log(`\n=== ${r.id} ===\n${r.response}\n`);
  }
}
```

## Cost Estimation

| Model | Cost per 1M tokens | 10 agents (~2K tokens each) |
|-------|-------------------|----------------------------|
| gpt-4o-mini | $0.15 in / $0.60 out | ~$0.02 |
| gpt-4o | $2.50 in / $10 out | ~$0.30 |
| claude-3.5-sonnet | $3 in / $15 out | ~$0.40 |

**Recommendation**: Use `gpt-4o-mini` for swarms (cheap + capable).

## Hybrid with Claude Agents

For the best of both worlds:

```
Phase 1: OpenRouter Swarm (analysis)
    │
    ├─ Agent 1: Find bugs
    ├─ Agent 2: Check types
    ├─ Agent 3: Find TODOs
    └─ Agent 4: Security scan
    │
    ▼
Phase 2: Claude Task Agents (fixes)
    │
    ├─ Task: Fix bug in src/api/client.ts:45
    ├─ Task: Add type to src/hooks/useAuth.ts
    └─ Task: Resolve TODO in src/components/Form.tsx
```

## When to Use This

- **Large codebase scans** - Run 10-50 agents in parallel
- **Code reviews** - Multiple aspects analyzed simultaneously
- **Migration planning** - Assess impact across many files
- **Documentation generation** - Analyze multiple modules at once
- **Dependency audits** - Check all packages in parallel