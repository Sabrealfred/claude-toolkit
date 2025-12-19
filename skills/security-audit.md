---
name: security-audit
description: Security audit expert for code scanning, vulnerability detection, OWASP compliance, and hardening. Use for security reviews, penetration testing prep, and compliance checks.
---

# Security Audit Expert Skill

Comprehensive security auditing with best-in-class tools and MCPs.

## Recommended MCP Servers

### 1. Semgrep MCP (Static Analysis)
```bash
# Install
npm install -g @semgrep/mcp-server

# Add to ~/.claude/mcp.json
{
  "semgrep": {
    "command": "semgrep-mcp",
    "args": []
  }
}
```
**Use for:** Code scanning, custom security rules, compliance checks
**Source:** [Semgrep Security Guide](https://semgrep.dev/blog/2025/a-security-engineers-guide-to-mcp/)

### 2. Snyk MCP (Dependency Scanning)
```bash
# Install Snyk CLI with MCP support
npm install -g snyk

# Add to ~/.claude/mcp.json
{
  "snyk": {
    "command": "snyk",
    "args": ["mcp"]
  }
}
```
**Use for:** Dependency vulnerabilities, license compliance, container scanning
**Source:** [Snyk MCP Integration](https://snyk.io/articles/10-mcp-servers-for-cybersecurity-professionals-and-elite-hackers/)

### 3. Cyproxio Security Collection (Penetration Testing)
```bash
# Clone and setup
git clone https://github.com/cyproxio/mcp-for-security
cd mcp-for-security
npm install
```
**Includes:** SQLMap, FFUF, NMAP, Masscan
**Use for:** Penetration testing, vulnerability discovery
**Source:** [GitHub - cyproxio/mcp-for-security](https://github.com/cyproxio/mcp-for-security)

## OWASP Top 10 Checklist

### A01: Broken Access Control
```typescript
// BAD
app.get('/user/:id', (req, res) => {
  const user = db.getUser(req.params.id); // No auth check!
  res.json(user);
});

// GOOD
app.get('/user/:id', requireAuth, (req, res) => {
  if (req.user.id !== req.params.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const user = db.getUser(req.params.id);
  res.json(user);
});
```

### A02: Cryptographic Failures
```typescript
// Check for:
// - Hardcoded secrets
// - Weak algorithms (MD5, SHA1 for passwords)
// - Secrets in logs
// - Unencrypted sensitive data

// BAD
const hash = crypto.createHash('md5').update(password).digest('hex');

// GOOD
const hash = await bcrypt.hash(password, 12);
```

### A03: Injection
```typescript
// SQL Injection - BAD
const query = `SELECT * FROM users WHERE id = ${userId}`;

// GOOD - Parameterized query
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);

// XSS - BAD
element.innerHTML = userInput;

// GOOD - Use DOMPurify
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

### A04: Insecure Design
- Threat modeling during design
- Security requirements in user stories
- Defense in depth

### A05: Security Misconfiguration
```typescript
// Check for:
// - Debug mode in production
// - Default credentials
// - Unnecessary features enabled
// - Missing security headers

// Add security headers
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
```

### A06: Vulnerable Components
```bash
# Scan dependencies
npm audit
snyk test

# Check for known vulnerabilities
npx audit-ci --moderate
```

### A07: Authentication Failures
```typescript
// Implement:
// - Rate limiting
// - Account lockout
// - Strong password policy
// - MFA

const useRateLimit = (key: string, maxAttempts: number, windowMs: number) => {
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  // ... implementation
};
```

### A08: Software and Data Integrity Failures
```bash
# Verify package integrity
npm ci --ignore-scripts  # Use lockfile, no scripts

# Use SRI for CDN resources
<script src="..." integrity="sha384-..." crossorigin="anonymous">
```

### A09: Security Logging and Monitoring
```typescript
// Log security events
const logSecurityEvent = (event: SecurityEvent) => {
  const sanitized = {
    type: event.type,
    userId: event.userId,
    ip: event.ip,
    timestamp: new Date().toISOString(),
    // Never log passwords, tokens, or PII
  };
  logger.info('SECURITY_EVENT', sanitized);
};
```

### A10: Server-Side Request Forgery (SSRF)
```typescript
// Validate URLs before fetching
const isAllowedUrl = (url: string): boolean => {
  const parsed = new URL(url);
  const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254'];
  return !blockedHosts.includes(parsed.hostname);
};
```

## Security Audit Workflow

### 1. Dependency Audit
```bash
# npm audit
npm audit --json > audit-results.json

# Snyk (more comprehensive)
snyk test --json > snyk-results.json
```

### 2. Static Analysis
```bash
# ESLint security plugin
npm install -D eslint-plugin-security
npx eslint --ext .ts,.tsx src/ --rule 'security/*: error'

# Semgrep
semgrep --config=p/security-audit src/
```

### 3. Secret Scanning
```bash
# Check for secrets in code
npx @secretlint/secretlint "**/*"

# Git history
git secrets --scan-history
```

### 4. Dynamic Testing (with Puppeteer MCP)
```
# Use puppeteer-mcp-claude for:
1. Test authentication flows
2. Check for XSS in rendered output
3. Verify CSP headers
4. Test CSRF protection
```

## Input Validation Library

```typescript
// src/lib/sanitize.ts

export const sanitizeString = (input: string): string => {
  return input
    .replace(/[<>]/g, '')           // Remove < >
    .replace(/['"]/g, '')           // Remove quotes
    .replace(/[\x00-\x1f]/g, '')    // Remove control chars
    .trim()
    .slice(0, 1000);                // Limit length
};

export const sanitizeEmail = (email: string): string | null => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleaned = email.toLowerCase().trim();
  return pattern.test(cleaned) ? cleaned : null;
};

export const sanitizeUUID = (uuid: string): string | null => {
  const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return pattern.test(uuid) ? uuid.toLowerCase() : null;
};

export const sanitizeNumber = (
  input: unknown,
  min: number,
  max: number,
  defaultVal: number
): number => {
  const num = Number(input);
  if (isNaN(num)) return defaultVal;
  return Math.max(min, Math.min(max, num));
};
```

## Rate Limiting Implementation

```typescript
// src/hooks/useRateLimit.ts
export const useRateLimit = (
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 5 * 60 * 1000
) => {
  const storageKey = `rateLimit_${key}`;

  const getState = (): { attempts: number; resetAt: number } => {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return { attempts: 0, resetAt: Date.now() + windowMs };
    return JSON.parse(stored);
  };

  const isLocked = (): boolean => {
    const state = getState();
    if (Date.now() > state.resetAt) {
      localStorage.removeItem(storageKey);
      return false;
    }
    return state.attempts >= maxAttempts;
  };

  const recordAttempt = (): void => {
    const state = getState();
    const newState = {
      attempts: state.attempts + 1,
      resetAt: state.resetAt
    };
    localStorage.setItem(storageKey, JSON.stringify(newState));
  };

  const getRemainingTime = (): number => {
    const state = getState();
    return Math.max(0, state.resetAt - Date.now());
  };

  return { isLocked, recordAttempt, getRemainingTime };
};
```

## Safe Error Handling

```typescript
// src/lib/errorUtils.ts

const errorMessageMap: Record<string, string> = {
  'Invalid login credentials': 'Invalid email or password',
  'Email not confirmed': 'Please verify your email',
  'User already registered': 'An account with this email exists',
  // Never expose: DB errors, stack traces, internal paths
};

export const getSafeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return errorMessageMap[error.message] || 'An error occurred. Please try again.';
  }
  return 'An error occurred. Please try again.';
};
```

## Multi-Agent Security Audit

Use the multi-agent MCP for parallel security scanning:

```
spawn_agents with:
- Task 1: "Audit authentication flows for OWASP A07 violations"
- Task 2: "Scan for SQL injection in all API routes"
- Task 3: "Check for XSS vulnerabilities in React components"
- Task 4: "Review RLS policies for privilege escalation"
- Task 5: "Audit dependency versions for known CVEs"
```

Model: `qwen3-coder-plus` (best for code analysis)
Budget: ~$0.70 for 100 agents

## Resources

- [OWASP Top 10](https://owasp.org/Top10/)
- [Snyk Vulnerability DB](https://snyk.io/vuln/)
- [CWE Database](https://cwe.mitre.org/)
- [Semgrep Rules](https://semgrep.dev/r)