---
name: skill-updater
description: Self-learning skill for updating and improving skills, MCPs, and workflows. Use when a process could be improved, a skill needs updating, or after solving a difficult problem.
---

# Skill Updater & Self-Learning Skill

Meta-skill for continuous improvement of Claude Code skills, MCPs, and workflows.

## When to Use This Skill

Invoke this skill when:
1. A skill is missing information that was just learned
2. A workaround was discovered for a common problem
3. A new best practice was identified
4. An MCP tool has undocumented behavior
5. A pain point was resolved and should be documented
6. A frequently used pattern should be templated

## Update Workflow

### 1. Identify Improvement Opportunity

```markdown
## Improvement Detected

**Type:** [skill_update | new_skill | mcp_config | workflow | template]
**Trigger:** [What happened that revealed the need?]
**Skill/Component:** [Which skill or system needs updating?]
**Current State:** [What exists now?]
**Proposed Change:** [What should be added/modified?]
**Impact:** [Who/what benefits from this change?]
```

### 2. Categorize the Learning

| Category | Description | Action |
|----------|-------------|--------|
| **Bug Fix** | Skill had wrong info | Update skill immediately |
| **Missing Pattern** | Common pattern not documented | Add to relevant skill |
| **New Tool** | New MCP or CLI discovered | Create config + docs |
| **Pain Point** | Frustration resolved | Document in skill + API_KEYS |
| **Best Practice** | Better way found | Update all relevant skills |
| **New Capability** | Feature not covered | Create new skill or section |

### 3. Update Protocol

```bash
# 1. Read current skill
Read /root/.claude/commands/[skill-name].md

# 2. Identify section to update
# - Quick Reference tables
# - Code examples
# - Best Practices section
# - Common Errors section

# 3. Edit skill
Edit /root/.claude/commands/[skill-name].md

# 4. Verify no breaking changes
# Read the skill again to confirm

# 5. Update backup
cp /root/.claude/commands/[skill-name].md /root/claude-summaries/skills-backup/

# 6. Log the update
echo "$(date): Updated [skill-name] - [brief description]" >> /root/claude-summaries/SKILL_UPDATE_LOG.md
```

## Self-Learning Patterns

### Pattern 1: Error Resolution → Documentation

When a difficult error is resolved:

```markdown
## Error Resolution Template

**Error:** [Exact error message]
**Context:** [When does this occur?]
**Root Cause:** [Why does this happen?]
**Solution:** [Step-by-step fix]
**Prevention:** [How to avoid in future]
**Skill to Update:** [Which skill should contain this?]
```

Example:
```markdown
## Error Resolution

**Error:** `TypeError: can't access property "useState", dispatcher is null`
**Context:** After installing @hello-pangea/dnd
**Root Cause:** Package creates duplicate React instances
**Solution:**
1. `npm uninstall @hello-pangea/dnd`
2. `rm -rf node_modules/.vite`
3. `npm run dev`
**Prevention:** Check package dependencies before installing
**Skill to Update:** react-expert.md → Common Errors section
```

### Pattern 2: Workaround Discovery → Template

When a workaround is found:

```markdown
## Workaround Template

**Problem:** [What doesn't work as expected?]
**Expected Behavior:** [What should happen?]
**Actual Behavior:** [What happens instead?]
**Workaround:** [How to get it working]
**Permanent Fix:** [Is there a better solution?]
**Add to Skill:** [Which skill?]
```

### Pattern 3: MCP Tool Behavior → Config Update

When MCP tool behavior is discovered:

```markdown
## MCP Discovery Template

**MCP Server:** [Name]
**Tool:** [Specific tool]
**Documented Behavior:** [What docs say]
**Actual Behavior:** [What actually happens]
**Required Config:** [Any special configuration?]
**Limitations:** [What doesn't work?]
**Update:** [What to add to devops.md or API_KEYS.md]
```

## Automatic Improvement Triggers

### After Every Session

Consider updating skills when:
- [ ] A new command was learned
- [ ] An API behaved differently than expected
- [ ] A configuration was discovered
- [ ] A debugging technique worked well
- [ ] A pattern was repeated 3+ times

### After Solving Complex Problems

Always document:
- [ ] The root cause
- [ ] The debugging steps that worked
- [ ] The final solution
- [ ] Any prerequisites or gotchas

### After Using MCPs

Note:
- [ ] Any authentication quirks
- [ ] Rate limits encountered
- [ ] Undocumented parameters
- [ ] Error messages and meanings

## Update Categories by Skill

### devops.md Updates
- New CLI tools installed
- Authentication methods
- Connection strings
- Deployment procedures

### supabase-expert.md Updates
- New RLS patterns
- Migration gotchas
- Function templates
- Connection issues

### react-expert.md Updates
- Package conflicts
- Hook patterns
- Vite configuration
- Build errors

### auth-specialist.md Updates
- Login flow fixes
- Token handling
- Provider-specific issues
- Timeout patterns

### crypto-trading.md Updates
- New exchange APIs
- Strategy patterns
- MCP configurations
- Rate limits

## Skill Health Check

Run periodically to verify skills are current:

```markdown
## Skill Health Check

### Check List
- [ ] All code examples still work
- [ ] Links are not broken
- [ ] Best practices are still valid
- [ ] Error solutions are current
- [ ] MCP configurations match installed versions

### Version Verification
- React version in react-expert.md matches package.json
- Supabase CLI version in devops.md matches installed
- MCP server versions match claude_desktop_config.json
```

## Creating New Skills

When to create a new skill instead of updating:

1. Topic doesn't fit existing skills
2. Topic is large enough for standalone skill
3. Topic has its own set of tools/MCPs
4. Topic is used frequently

### New Skill Template

```markdown
---
name: skill-name
description: One-line description of when to use this skill.
---

# Skill Title

Brief overview of what this skill covers.

## Quick Reference

| Item | Description |
|------|-------------|
| ... | ... |

## Setup / Installation

[How to get started]

## Common Patterns

### Pattern 1: Name
[Code/commands]

### Pattern 2: Name
[Code/commands]

## Best Practices

1. First practice
2. Second practice
...

## Common Errors & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| ... | ... | ... |

## Integration with Other Skills

- **skill-name**: How they work together
```

## Feedback Loop

### After Updates
1. Test the updated information
2. Verify examples work
3. Check for conflicts with other skills
4. Update cross-references if needed

### Tracking Improvements
```markdown
# /root/claude-summaries/SKILL_UPDATE_LOG.md

## 2025-12-19
- Updated react-expert.md: Added @hello-pangea/dnd warning
- Updated devops.md: Added supabase pooler fallback
- Created crypto-trading.md: New skill for crypto MCPs
- Updated API_KEYS_AND_CONFIGS.md: Added Azure credentials
```

## Integration with Multi-Agent

Use multi-agent for bulk skill updates:

```javascript
mcp__multi-agent__spawn_agents({
  model: "gemini-3-pro",
  tasks: [
    { id: "audit-1", task: "Review devops.md for outdated information" },
    { id: "audit-2", task: "Review react-expert.md for missing patterns" },
    { id: "audit-3", task: "Review supabase-expert.md for new features" },
  ]
})
```

## Skill Versioning

Track major updates:

```markdown
## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-19 | Initial creation |
| 1.1 | 2025-12-20 | Added MCP configurations |
| 1.2 | 2025-12-21 | Fixed auth patterns |
```