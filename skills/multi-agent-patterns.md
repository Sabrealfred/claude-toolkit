---
name: multi-agent-patterns
description: Multi-agent orchestration patterns for parallel tasks. Use when spawning 10-100+ agents for code review, security audits, data processing, or any parallelizable work.
---

# Multi-Agent Orchestration Patterns

Expert guide for leveraging multi-agent MCP for 10x-100x productivity gains.

## Available Models (Cost Optimized)

| Model | Type | Best For | Cost |
|-------|------|----------|------|
| `devstral-free` | Code | Bulk code tasks | FREE |
| `qwen3-coder-free` | Code | Code generation | FREE |
| `llama-70b-free` | General | Research, analysis | FREE |
| `deepseek-v3.2` | Reasoning | Complex analysis | $$ |
| `kimi-k2-thinking` | Reasoning | Architecture decisions | $$ |
| `qwen3-coder-plus` | Code | Quality code review | $$ |
| `gemini-3-pro` | General | Best quality | $$$ |

## Core Patterns

### Pattern 1: Parallel Code Review (100+ files)

```javascript
// Use spawn_agents for bulk operations
mcp__multi-agent__spawn_agents({
  model: "devstral-free",  // FREE for bulk
  tasks: files.map((file, i) => ({
    id: `review-${i}`,
    task: `Review ${file} for bugs, security issues, and code quality`,
    searchTerms: file  // RAG context
  }))
})
```

**Real Example: Security Audit**
```javascript
// 195 agents reviewing codebase
spawn_agents({
  model: "devstral-free",
  tasks: [
    { id: "xss-1", task: "Find XSS vulnerabilities in React components", searchTerms: "dangerouslySetInnerHTML innerHTML" },
    { id: "sql-1", task: "Find SQL injection risks", searchTerms: "query raw sql" },
    { id: "auth-1", task: "Review authentication bypass risks", searchTerms: "auth login session" },
    // ... 192 more tasks
  ]
})
```

### Pattern 2: Smart Routing (Auto Model Selection)

```javascript
// Let the system choose the best model per task
mcp__multi-agent__smart_spawn({
  budget: "balanced",  // free-first | balanced | quality-first
  tasks: [
    { id: "simple", task: "Format this JSON file" },           // -> free model
    { id: "complex", task: "Design authentication architecture" } // -> premium model
  ]
})
```

### Pattern 3: Hierarchical Orchestration

```javascript
// Chiefs plan, Workers execute
mcp__multi-agent__orchestrate_hierarchy({
  domains: ["frontend", "backend", "database", "testing"],
  chiefModel: "kimi-k2-thinking",   // Smart planning
  workerModel: "devstral-free",     // Cheap execution
  projectContext: "E-commerce platform with React + Supabase"
})
```

**Output Structure:**
```
Chief (kimi-k2-thinking)
├── Frontend Lead
│   ├── Worker 1: Component review
│   ├── Worker 2: State management
│   └── Worker 3: Performance audit
├── Backend Lead
│   ├── Worker 1: API review
│   └── Worker 2: Auth review
└── Database Lead
    ├── Worker 1: Schema review
    └── Worker 2: RLS audit
```

### Pattern 4: Pipeline Execution (PLAN → WORK → QA → SHIP)

```javascript
// Complete automated pipeline
mcp__multi-agent__pipeline_execute({
  goal: "Fix all TypeScript errors in the codebase",
  domain: "fullstack",
  budget: "balanced",
  maxTasks: 20,
  skipQA: false  // ALWAYS run QA
})
```

**Pipeline Stages:**
1. **PLANNER** generates tasks from goal
2. **WORKERS** execute tasks (with escalation for hard ones)
3. **QA_AUDITOR** validates ALL results
4. Returns: SHIP_IT or NEEDS_WORK verdict

### Pattern 5: Consensus QA (Multiple Model Agreement)

```javascript
// Critical changes need multiple approvals
mcp__multi-agent__multi_qa_consensus({
  changes: [
    { file: "auth.ts", code: "...", description: "New auth flow" }
  ],
  context: "Replacing authentication system",
  qaModels: ["deepseek-v3.2", "kimi-k2-thinking", "gemini-3-pro"],
  requiredApprovals: 2  // 2 of 3 must approve
})
```

### Pattern 6: Single Agent with RAG Context

```javascript
// For focused tasks needing codebase context
mcp__multi-agent__agent_with_rag({
  task: "How does the authentication flow work?",
  searchTerms: "auth login session token",
  model: "qwen3-coder-free"
})
```

### Pattern 7: Model Comparison

```javascript
// Compare different models on same task
mcp__multi-agent__compare_models({
  task: "Review this algorithm for edge cases",
  models: ["devstral-free", "deepseek-v3.2", "gemini-3-pro"]
})
```

## Use Cases by Scale

### Small (5-10 agents)
- Code review of a feature branch
- Bug hunting in specific module
- Documentation generation

```javascript
spawn_agents({
  model: "qwen3-coder-free",
  tasks: [
    { id: "1", task: "Review authentication module" },
    { id: "2", task: "Review database queries" },
    { id: "3", task: "Review API endpoints" },
    { id: "4", task: "Review error handling" },
    { id: "5", task: "Review input validation" }
  ]
})
```

### Medium (20-50 agents)
- Full security audit
- Codebase migration analysis
- Test coverage analysis

```javascript
smart_spawn({
  budget: "balanced",
  tasks: generateSecurityTasks(allFiles)  // 50 tasks
})
```

### Large (100+ agents)
- Enterprise codebase audit
- Compliance checking
- Mass refactoring analysis

```javascript
spawn_agents({
  model: "devstral-free",  // FREE for scale
  tasks: generateAuditTasks(entireCodebase)  // 200+ tasks
})
```

## Cost Estimation

```javascript
// Before running, estimate cost
mcp__multi-agent__estimate_cost({
  numAgents: 100,
  model: "devstral-free",
  avgInputTokens: 2000,
  avgOutputTokens: 1000
})
// Returns: $0.00 (free model)

mcp__multi-agent__estimate_cost({
  numAgents: 100,
  model: "gemini-3-pro",
  avgInputTokens: 2000,
  avgOutputTokens: 1000
})
// Returns: $X.XX (premium model)
```

## Escalation Pattern

```javascript
// When a worker fails, escalate to specialist
mcp__multi-agent__escalate_task({
  task: "Design distributed caching architecture",
  failureReason: "Worker couldn't determine optimal cache invalidation strategy",
  previousAttempt: "...",
  specialistModel: "kimi-k2-thinking",
  searchTerms: "cache redis invalidation"
})
```

## Best Practices

### 1. Start with Free Models
```javascript
// Always try free first
spawn_agents({ model: "devstral-free", tasks: [...] })
// Only upgrade if quality insufficient
```

### 2. Use RAG for Context
```javascript
// Add searchTerms for relevant code
tasks: [
  { id: "1", task: "Review auth", searchTerms: "authentication login" }
]
```

### 3. Break Down Complex Tasks
```javascript
// BAD: One mega-task
{ task: "Review entire codebase for all issues" }

// GOOD: Specific tasks
{ task: "Find XSS vulnerabilities in user input handlers" }
{ task: "Find SQL injection in database queries" }
{ task: "Find authentication bypass risks" }
```

### 4. Always QA Critical Changes
```javascript
// Never skip QA for production code
pipeline_execute({
  goal: "...",
  skipQA: false  // ALWAYS
})
```

### 5. Use Hierarchy for Complex Projects
```javascript
// Let chiefs coordinate workers
orchestrate_hierarchy({
  domains: ["frontend", "backend", "devops"],
  chiefModel: "kimi-k2-thinking",
  workerModel: "devstral-free"
})
```

## Integration with Other Skills

- **security-audit**: Use 100+ agents for comprehensive security review
- **supabase-expert**: Parallel RLS policy review
- **react-expert**: Component-by-component review
- **ma-pipeline**: Parallel due diligence research

## Quick Reference

| Tool | When to Use |
|------|-------------|
| `spawn_agents` | Bulk parallel tasks, same model |
| `smart_spawn` | Auto model selection per task |
| `pipeline_execute` | Full workflow with QA |
| `orchestrate_hierarchy` | Complex multi-domain projects |
| `agent_with_rag` | Single focused task with context |
| `compare_models` | Find best model for task type |
| `qa_validate` | Validate changes before shipping |
| `multi_qa_consensus` | Critical changes needing approval |
| `escalate_task` | Worker failed, need specialist |
| `estimate_cost` | Budget planning |