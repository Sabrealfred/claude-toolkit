---
name: webapp-testing
description: Web application testing with Playwright MCP. Use for E2E tests, visual regression, auth flow testing, and automated QA. Works with running dev server.
---

# Web Application Testing Skill

E2E testing with Playwright MCP - the #1 ranked MCP for browser automation.

## Required Tools & Dependencies

### CLI Tools
```bash
# Node.js (required)
node --version  # 18+

# Playwright CLI
npm install -D @playwright/test
npx playwright install  # Install browsers (Chromium, Firefox, WebKit)
```

### NPM Packages
```bash
# Playwright Test Runner
npm install -D @playwright/test

# Unit Testing (Vitest)
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# React Testing Utilities
npm install -D @testing-library/user-event
```

### MCP Servers
```bash
# Option 1: Official Microsoft Playwright MCP
npx @playwright/mcp@latest

# Option 2: Puppeteer MCP (already available in Claude Code)
# Uses: mcp__puppeteer-mcp-claude__*
```

### Playwright Config
```bash
# Initialize Playwright config
npx playwright init

# Run tests
npx playwright test

# Debug mode
npx playwright test --debug

# Visual UI
npx playwright test --ui
```

### Environment Setup
```bash
# Install browsers
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit

# Or install all
npx playwright install
```

---

## Playwright MCP Setup

### Install Official Microsoft Playwright MCP
```bash
# Add to VS Code settings or Claude config
npx @playwright/mcp@latest

# Or add to ~/.claude/mcp.json
{
  "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp@latest"]
  }
}
```

**Source:** [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp)

### Alternative: Puppeteer MCP (Already Available)
You already have `puppeteer-mcp-claude` configured. It provides:
- `puppeteer_launch` - Start browser
- `puppeteer_new_page` - Create page
- `puppeteer_navigate` - Go to URL
- `puppeteer_click` - Click element
- `puppeteer_type` - Type text
- `puppeteer_screenshot` - Capture screenshot
- `puppeteer_get_text` - Extract text
- `puppeteer_evaluate` - Run JavaScript
- `puppeteer_wait_for_selector` - Wait for element

## Testing Workflows

### 1. Basic Page Load Test
```
1. Launch browser (headless for CI, headed for debugging)
   mcp__puppeteer-mcp-claude__puppeteer_launch
   { "headless": true }

2. Create page
   mcp__puppeteer-mcp-claude__puppeteer_new_page
   { "pageId": "main" }

3. Navigate to page
   mcp__puppeteer-mcp-claude__puppeteer_navigate
   { "pageId": "main", "url": "http://localhost:5173/" }

4. Take screenshot
   mcp__puppeteer-mcp-claude__puppeteer_screenshot
   { "pageId": "main", "path": "/tmp/homepage.png" }

5. Close browser
   mcp__puppeteer-mcp-claude__puppeteer_close_browser
   {}
```

### 2. Login Flow Test
```
# Setup
puppeteer_launch({ headless: false, viewport: { width: 1280, height: 720 } })
puppeteer_new_page({ pageId: "login-test" })

# Navigate to login
puppeteer_navigate({ pageId: "login-test", url: "http://localhost:5173/login" })
puppeteer_screenshot({ pageId: "login-test", path: "/tmp/01-login-page.png" })

# Fill form
puppeteer_type({ pageId: "login-test", selector: "input[name='email']", text: "test@example.com" })
puppeteer_type({ pageId: "login-test", selector: "input[name='password']", text: "password123" })
puppeteer_screenshot({ pageId: "login-test", path: "/tmp/02-form-filled.png" })

# Submit
puppeteer_click({ pageId: "login-test", selector: "button[type='submit']" })

# Wait for redirect
puppeteer_wait_for_selector({ pageId: "login-test", selector: ".dashboard", timeout: 10000 })
puppeteer_screenshot({ pageId: "login-test", path: "/tmp/03-dashboard.png" })

# Cleanup
puppeteer_close_browser({})
```

### 3. Form Validation Test
```
# Navigate to form
puppeteer_navigate({ pageId: "test", url: "http://localhost:5173/register" })

# Submit empty form
puppeteer_click({ pageId: "test", selector: "button[type='submit']" })

# Check for validation errors
puppeteer_wait_for_selector({ pageId: "test", selector: ".error-message" })
puppeteer_get_text({ pageId: "test", selector: ".error-message" })
puppeteer_screenshot({ pageId: "test", path: "/tmp/validation-errors.png" })
```

### 4. Responsive Testing
```
# Desktop
puppeteer_launch({ viewport: { width: 1920, height: 1080 } })
puppeteer_navigate({ pageId: "responsive", url: "http://localhost:5173/" })
puppeteer_screenshot({ pageId: "responsive", path: "/tmp/desktop.png" })

# Tablet
puppeteer_evaluate({ pageId: "responsive", script: "window.resizeTo(768, 1024)" })
puppeteer_screenshot({ pageId: "responsive", path: "/tmp/tablet.png" })

# Mobile
puppeteer_evaluate({ pageId: "responsive", script: "window.resizeTo(375, 812)" })
puppeteer_screenshot({ pageId: "responsive", path: "/tmp/mobile.png" })
```

### 5. Visual Regression Test
```
# Take baseline screenshot
puppeteer_navigate({ pageId: "visual", url: "http://localhost:5173/component" })
puppeteer_screenshot({ pageId: "visual", path: "/tmp/baseline.png", fullPage: true })

# After code changes, take new screenshot
puppeteer_screenshot({ pageId: "visual", path: "/tmp/current.png", fullPage: true })

# Compare with diff tool (use Bash)
compare -compose src /tmp/baseline.png /tmp/current.png /tmp/diff.png
```

## Common Test Scenarios

### Staff Portal Access
```javascript
// Test staff-only routes
1. Login as regular user
2. Try to access /staff/dashboard
3. Verify redirect to /unauthorized or /login
4. Login as staff user
5. Verify /staff/dashboard loads
6. Screenshot for visual verification
```

### Rate Limiting
```javascript
// Test login rate limit
for (let i = 0; i < 6; i++) {
  puppeteer_type({ selector: "input[name='email']", text: "test@example.com" })
  puppeteer_type({ selector: "input[name='password']", text: "wrongpassword" })
  puppeteer_click({ selector: "button[type='submit']" })
  // Wait for error
  await page.waitForTimeout(1000);
}
// After 5 attempts, should see lockout message
puppeteer_get_text({ selector: ".lockout-message" })
```

### XSS Prevention
```javascript
// Test XSS in input fields
puppeteer_type({
  selector: "input[name='search']",
  text: '<script>alert("xss")</script>'
})
puppeteer_click({ selector: "button[type='submit']" })

// Verify script not executed (no alert)
// Check that input is sanitized in output
puppeteer_get_text({ selector: ".search-results" })
```

## JavaScript Execution Examples

### Check Console Errors
```javascript
puppeteer_evaluate({
  pageId: "test",
  script: `
    const errors = [];
    const originalError = console.error;
    console.error = (...args) => {
      errors.push(args.join(' '));
      originalError.apply(console, args);
    };
    return errors;
  `
})
```

### Get Performance Metrics
```javascript
puppeteer_evaluate({
  pageId: "test",
  script: `
    const timing = performance.timing;
    return {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstPaint: performance.getEntriesByType('paint')[0]?.startTime
    };
  `
})
```

### Check Accessibility
```javascript
puppeteer_evaluate({
  pageId: "test",
  script: `
    const issues = [];
    document.querySelectorAll('img:not([alt])').forEach(img => {
      issues.push('Image missing alt: ' + img.src);
    });
    document.querySelectorAll('button:not([aria-label]):empty').forEach(btn => {
      issues.push('Button missing label');
    });
    return issues;
  `
})
```

## Integration with Dev Workflow

### Before Testing
```bash
# Ensure dev server is running
lsof -i :5173 || npm run dev &

# Wait for server
sleep 5
```

### After Testing
```bash
# View screenshots
ls -la /tmp/*.png

# Open in browser (if GUI available)
xdg-open /tmp/homepage.png
```

## Test Report Template

```markdown
# Test Report - [Feature Name]

## Environment
- Date: [timestamp]
- URL: http://localhost:5173
- Browser: Chromium (Puppeteer)

## Test Cases

### TC-001: Login Flow
- [x] Page loads
- [x] Form validates empty fields
- [x] Login with valid credentials succeeds
- [x] Dashboard renders after login
- **Screenshots:** 01-login.png, 02-filled.png, 03-dashboard.png

### TC-002: Rate Limiting
- [x] 5 failed attempts allowed
- [x] 6th attempt shows lockout
- [x] Lockout message displays countdown
- **Screenshots:** rate-limit-1.png, rate-limit-lockout.png

## Issues Found
1. [BUG] Button not visible on mobile viewport
2. [UI] Form spacing inconsistent

## Recommendations
- Add loading spinner on submit
- Improve error message clarity
```

## Parallel Testing with Multi-Agent

Use the multi-agent MCP for parallel test execution:

```
spawn_agents with:
- Task 1: "Test login flow on /login - verify form, submit, redirect"
- Task 2: "Test registration flow on /register - verify validation"
- Task 3: "Test password reset flow on /forgot-password"
- Task 4: "Test staff portal access control on /staff/*"
- Task 5: "Run responsive tests on homepage - desktop, tablet, mobile"
```

Each agent can use Puppeteer MCP to run tests in parallel.

## Resources

- [Playwright MCP](https://github.com/microsoft/playwright-mcp) - Official Microsoft
- [Puppeteer Docs](https://pptr.dev/) - Node.js browser automation
- [Testing Library](https://testing-library.com/) - DOM testing utilities