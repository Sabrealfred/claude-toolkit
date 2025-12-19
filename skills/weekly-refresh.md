---
name: weekly-refresh
description: Self-learning weekly skill refresh. Reviews conversations, extracts patterns, updates skills, validates documentation. Run every Friday.
---

# Weekly Skill Refresh System

Automated self-learning system that evolves Claude Code skills based on real usage patterns.

## Quick Start

Run this skill every Friday (or after significant sessions):
```
/weekly-refresh
```

---

## Weekly Refresh Checklist

### Phase 1: Data Collection (5 min)

```bash
# 1. Count recent conversation summaries
ls -la /root/claude-summaries/*.md | tail -20

# 2. Check for new error patterns in conversations
grep -ri "error\|failed\|frustrat\|pain\|issue\|bug\|workaround" /root/claude-summaries/*.md | head -30

# 3. List all current skills
ls -la /root/.claude/commands/*.md | wc -l
```

### Phase 2: Pattern Extraction (10 min)

Look for these patterns in recent conversations:

| Pattern Type | Search Query | Action |
|--------------|--------------|--------|
| **Errors** | `grep -i "error\|failed" summaries/` | Add to relevant skill's "Common Errors" |
| **Workarounds** | `grep -i "workaround\|fixed by" summaries/` | Document in skill |
| **New Tools** | `grep -i "installed\|npm install\|pip install" summaries/` | Update devops.md |
| **MCP Issues** | `grep -i "mcp\|tool" summaries/` | Update multi-agent-patterns.md |
| **Auth Issues** | `grep -i "auth\|login\|token" summaries/` | Update auth-specialist.md |
| **Deploy Issues** | `grep -i "deploy\|netlify\|vercel" summaries/` | Update rapid-deploy.md |

### Phase 3: Skill Updates (15 min)

For each pattern found:

```markdown
## Update Template

**Date**: [YYYY-MM-DD]
**Pattern Found**: [Description]
**Source**: [Conversation summary file]
**Skill to Update**: [skill-name.md]
**Section**: [Section name]
**Update Type**: [add | modify | remove]
**Content**:
[New content to add/modify]
```

### Phase 4: Validation (5 min)

```bash
# Validate all skills have required sections
for skill in /root/.claude/commands/*.md; do
  echo "Checking: $skill"
  grep -q "^---" "$skill" && echo "  ✓ Has frontmatter" || echo "  ✗ Missing frontmatter"
  grep -q "## " "$skill" && echo "  ✓ Has sections" || echo "  ✗ Missing sections"
done

# Backup after updates
cp /root/.claude/commands/*.md /root/claude-summaries/skills-backup/
```

### Phase 5: Report Generation (5 min)

Generate weekly report:

```markdown
# Weekly Refresh Report - [DATE]

## Summary
- Skills Reviewed: X
- Skills Updated: Y
- New Skills Created: Z
- Patterns Extracted: N

## Updates Made
1. [skill-name.md] - Added [description]
2. [skill-name.md] - Updated [description]

## New Learnings
- [Learning 1]
- [Learning 2]

## Next Week Focus
- [Priority 1]
- [Priority 2]
```

---

## Automated Pattern Detection

### Error Pattern Extraction

```javascript
// Use multi-agent for parallel pattern extraction
mcp__multi-agent__spawn_agents({
  model: "qwen3-coder-free",
  tasks: [
    { id: "errors", task: "Search conversation summaries for error patterns and solutions" },
    { id: "tools", task: "Find new tools or packages installed in recent sessions" },
    { id: "workarounds", task: "Extract workarounds and fixes from conversations" },
    { id: "pain-points", task: "Identify recurring frustrations or pain points" },
  ]
});
```

### Skill Health Analysis

```typescript
interface SkillHealth {
  name: string;
  lastUpdated: Date;
  sectionsCount: number;
  hasErrors: boolean;
  hasBestPractices: boolean;
  linkedSkills: string[];
  mcpIntegrations: string[];
}

// Check each skill's health
function analyzeSkillHealth(skillPath: string): SkillHealth {
  // Read skill content
  // Parse frontmatter
  // Count sections
  // Check for required sections
  // Return health report
}
```

---

## Learning Categories

### Category 1: Technical Errors

When a new error is discovered:

1. **Document the error** in the relevant skill
2. **Add the solution** with code example
3. **Link to related skills** if applicable
4. **Update API_KEYS_AND_CONFIGS.md** if credentials involved

Example entry:
```markdown
### Error: EADDRINUSE port 3000

**Cause**: Port already in use by another process
**Solution**:
```bash
lsof -i :3000
kill -9 <PID>
# Or use different port
npm run dev -- --port 3001
```
**Prevention**: Check port availability before starting
```

### Category 2: New Tools/Packages

When a new tool is used:

1. **Add to devops.md** installation section
2. **Document common commands**
3. **Note any gotchas or issues**
4. **Update API_KEYS_AND_CONFIGS.md** if API key needed

### Category 3: Workflow Improvements

When a better workflow is discovered:

1. **Update relevant skill** with new workflow
2. **Add "Best Practice" note**
3. **Update integration maps** if skills connect differently

### Category 4: MCP Discoveries

When MCP behavior is discovered:

1. **Add to multi-agent-patterns.md**
2. **Update devops.md** MCP config section
3. **Document any limitations**

---

## Skill Evolution Rules

### When to Update vs Create New

| Condition | Action |
|-----------|--------|
| New pattern fits existing skill | Update existing skill |
| Pattern is > 500 words | Consider dedicated section |
| Pattern is entirely new domain | Create new skill |
| Pattern connects multiple skills | Update integration maps |

### Update Priority

1. **Critical**: Security issues, broken workflows
2. **High**: Common errors, frequently used patterns
3. **Medium**: Nice-to-have improvements
4. **Low**: Minor documentation fixes

---

## Weekly Schedule

### Monday
- Review weekend session summaries
- Quick error check

### Wednesday
- Mid-week pattern review
- Update any urgent items

### Friday (Main Refresh)
- Full pattern extraction
- Skill updates
- Validation
- Backup
- Generate report

---

## Self-Improvement Metrics

Track these metrics weekly:

| Metric | Target | Current |
|--------|--------|---------|
| Skills Updated | 3+/week | - |
| New Patterns Documented | 5+/week | - |
| Error Solutions Added | 2+/week | - |
| Skill Health Score | 90%+ | - |

### Health Score Calculation

```
Health = (
  (Skills with frontmatter / Total) * 25 +
  (Skills with examples / Total) * 25 +
  (Skills with error section / Total) * 25 +
  (Skills with integrations / Total) * 25
)
```

---

## Integration with n8n (Automation)

### Auto-Backup Workflow

```json
{
  "name": "Weekly Skill Backup",
  "nodes": [
    {
      "name": "Schedule",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": { "interval": [{ "field": "weeks", "weeksInterval": 1, "triggerAtDay": [5] }] }
      }
    },
    {
      "name": "Backup Skills",
      "type": "n8n-nodes-base.executeCommand",
      "parameters": {
        "command": "cp /root/.claude/commands/*.md /root/claude-summaries/skills-backup/"
      }
    }
  ]
}
```

### Notification on Skill Update

```json
{
  "name": "Skill Update Notification",
  "nodes": [
    {
      "name": "Watch Folder",
      "type": "n8n-nodes-base.localFileTrigger",
      "parameters": {
        "path": "/root/.claude/commands/",
        "events": ["change"]
      }
    },
    {
      "name": "Slack Notify",
      "type": "n8n-nodes-base.slack",
      "parameters": {
        "operation": "postMessage",
        "channel": "#skills-updates",
        "text": "Skill updated: {{ $json.path }}"
      }
    }
  ]
}
```

---

## Report Template

```markdown
# Weekly Skill Refresh Report

**Week**: [Week Number] [Year]
**Date**: [YYYY-MM-DD]
**Run By**: Claude Code

---

## 1. Conversations Reviewed

| Date | Summary File | Key Topics |
|------|--------------|------------|
| ... | ... | ... |

---

## 2. Patterns Extracted

### Errors Found
- [ ] Error 1: [description] → Added to [skill]
- [ ] Error 2: [description] → Added to [skill]

### New Tools/Packages
- [ ] Tool 1: [description] → Added to devops.md
- [ ] Tool 2: [description] → Added to [skill]

### Workflow Improvements
- [ ] Improvement 1: [description]

---

## 3. Skills Updated

| Skill | Update Type | Description |
|-------|-------------|-------------|
| ... | ... | ... |

---

## 4. New Skills Created

| Skill | Purpose | Key Features |
|-------|---------|--------------|
| ... | ... | ... |

---

## 5. Health Check Results

| Metric | Previous | Current | Change |
|--------|----------|---------|--------|
| Total Skills | ... | ... | ... |
| Health Score | ...% | ...% | ... |

---

## 6. Next Week Priorities

1. [Priority 1]
2. [Priority 2]
3. [Priority 3]

---

*Report generated: [timestamp]*
```

---

## Quick Commands

```bash
# Quick skill count
ls /root/.claude/commands/*.md | wc -l

# Recent updates
ls -lt /root/.claude/commands/*.md | head -10

# Search all skills for keyword
grep -ri "KEYWORD" /root/.claude/commands/

# Validate frontmatter in all skills
for f in /root/.claude/commands/*.md; do head -5 "$f"; done

# Full backup
cp -r /root/.claude/commands/ /root/claude-summaries/skills-backup-$(date +%Y%m%d)/
```

---

## Integration with Other Skills

- **skill-updater**: Detailed update procedures
- **pm-status**: Project-specific documentation
- **save-session**: Session summary creation
- **multi-agent-patterns**: Parallel analysis for pattern extraction

---

*Self-learning is continuous. Every conversation is an opportunity to improve.*