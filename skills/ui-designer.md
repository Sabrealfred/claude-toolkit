---
name: ui-designer
description: UI/UX design expert with Magic MCP (21st.dev), Figma integration, component libraries. Use for creating beautiful UI, finding inspiration, refining designs, and logo search.
---

# UI/UX Designer Skill

Create stunning UI components with AI-powered tools and design systems.

## Available MCP Tools

### Magic MCP (21st.dev) - ALREADY INSTALLED

| Tool | Purpose |
|------|---------|
| `mcp__magic__21st_magic_component_builder` | Create new UI components from description |
| `mcp__magic__21st_magic_component_inspiration` | Find component inspiration from 21st.dev |
| `mcp__magic__21st_magic_component_refiner` | Improve/redesign existing components |
| `mcp__magic__logo_search` | Search and insert brand logos (JSX/TSX/SVG) |

### How to Use Magic MCP

**Create Component:**
```
/ui Create a pricing card with 3 tiers, monthly/yearly toggle, popular badge
```

**Find Inspiration:**
```
/21 Show me hero section examples with gradient backgrounds
```

**Refine Existing:**
```
/ui Improve this button to have better hover states and loading animation
```

**Get Logos:**
```
/logo GitHub Discord Stripe
```

## Recommended Additional MCPs

### 1. Figma MCP (Framelink)
```bash
# Install
npm install -g @anthropic/mcp-server-figma

# Add to ~/.claude/mcp.json
{
  "figma": {
    "command": "npx",
    "args": ["@anthropic/mcp-server-figma"],
    "env": {
      "FIGMA_ACCESS_TOKEN": "your-figma-token"
    }
  }
}
```
**Get token:** Figma > Settings > Access tokens
**Source:** [Figma MCP Server](https://www.builder.io/blog/figma-mcp-server)

### 2. Magic UI MCP (Official)
```bash
# Different from 21st.dev Magic - this is magicui.design
npm install -g @magicui/mcp

# Add to config
{
  "magicui": {
    "command": "npx",
    "args": ["@magicui/mcp"]
  }
}
```
**Source:** [Magic UI MCP](https://magicui.design/docs/mcp)

## Component Creation Workflow

### Step 1: Find Inspiration
```
mcp__magic__21st_magic_component_inspiration
{
  "message": "I need a modern dashboard sidebar with navigation",
  "searchQuery": "dashboard sidebar navigation"
}
```

### Step 2: Create Component
```
mcp__magic__21st_magic_component_builder
{
  "message": "Create a dashboard sidebar with icons, collapsible sections, and user avatar",
  "searchQuery": "sidebar navigation",
  "absolutePathToCurrentFile": "/root/myapp/src/components/Sidebar.tsx",
  "absolutePathToProjectDirectory": "/root/myapp",
  "standaloneRequestQuery": "Dashboard sidebar with: logo, nav items with icons, collapsible sections, user profile at bottom"
}
```

### Step 3: Refine Design
```
mcp__magic__21st_magic_component_refiner
{
  "userMessage": "Add smooth animations and hover effects",
  "absolutePathToRefiningFile": "/root/myapp/src/components/Sidebar.tsx",
  "context": "Add slide-in animation, hover highlights, and transition effects"
}
```

### Step 4: Add Logos
```
mcp__magic__logo_search
{
  "queries": ["stripe", "github", "google"],
  "format": "TSX"
}
```

## Design System Integration

### Using shadcn/ui
```bash
# Add components as needed
npx shadcn-ui@latest add button dialog card form
```

**Best components from shadcn:**
- `Button` - With variants and loading state
- `Card` - For content containers
- `Dialog` - Modal windows
- `Form` - With react-hook-form integration
- `Sonner` - Toast notifications
- `Command` - Command palette (⌘K)

### Tailwind CSS Patterns

**Gradient Text:**
```tsx
<h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
  Gradient Title
</h1>
```

**Glass Effect:**
```tsx
<div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl">
  Glass Card
</div>
```

**Hover Lift:**
```tsx
<div className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
  Hover me
</div>
```

**Skeleton Loading:**
```tsx
<div className="animate-pulse bg-gray-200 rounded h-4 w-full" />
```

## Common UI Patterns

### Hero Section
```
/ui Create a hero section with:
- Large headline with gradient
- Subtitle
- Two CTAs (primary and secondary)
- Background with subtle pattern
- Responsive for mobile
```

### Pricing Cards
```
/ui Create pricing cards with:
- 3 tiers: Basic, Pro, Enterprise
- Monthly/yearly toggle with discount
- Popular badge on middle tier
- Feature list with checkmarks
- CTA buttons
```

### Dashboard Layout
```
/ui Create dashboard layout with:
- Collapsible sidebar
- Top navbar with search and user menu
- Main content area with card grid
- Mobile responsive with hamburger menu
```

### Auth Pages
```
/ui Create login page with:
- Centered card
- Email and password fields
- Remember me checkbox
- Forgot password link
- Social login buttons
- Link to register
```

## Animation Libraries

### Framer Motion
```typescript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Animated content
</motion.div>
```

### Auto-Animate
```typescript
import { useAutoAnimate } from '@formkit/auto-animate/react';

const [parent] = useAutoAnimate();
return <ul ref={parent}>{items.map(...)}</ul>;
```

## Color Palettes

### Modern SaaS
```css
--primary: 220 90% 56%;     /* Blue */
--secondary: 280 84% 60%;   /* Purple */
--accent: 340 82% 52%;      /* Pink */
--background: 0 0% 100%;
--foreground: 240 10% 4%;
```

### Dark Mode
```css
--background: 240 10% 4%;
--foreground: 0 0% 98%;
--card: 240 6% 10%;
--border: 240 4% 16%;
```

## Icon Libraries

### Lucide React (Recommended)
```bash
npm install lucide-react
```
```tsx
import { Home, Settings, User, ChevronRight } from 'lucide-react';
<Home className="w-5 h-5" />
```

### Heroicons
```bash
npm install @heroicons/react
```
```tsx
import { HomeIcon } from '@heroicons/react/24/outline';
```

## Testing UI with Puppeteer

Use the puppeteer MCP to verify designs:
```
1. Navigate to component page
2. Take screenshots at different viewports
3. Verify responsive behavior
4. Check hover/focus states
```

## Resources

- [21st.dev](https://21st.dev) - Component library
- [shadcn/ui](https://ui.shadcn.com) - Component system
- [Tailwind CSS](https://tailwindcss.com) - Utility CSS
- [Lucide Icons](https://lucide.dev) - Icon library
- [Figma MCP](https://github.com/GLips/Figma-Context-MCP) - Figma integration