---
name: react-expert
description: React + Vite + TypeScript + shadcn/ui expert. Use for component development, hooks debugging, lazy loading, auth contexts, and Vite issues.
---

# React/Vite/TypeScript Expert Skill

Expert knowledge for React 18 + Vite + TypeScript + shadcn/ui stack.

## Required Tools & Dependencies

### CLI Tools
```bash
# Verify these are installed
node --version    # Node.js 18+
npm --version     # npm 9+
```

### Core Dependencies
```bash
# Create new project
npm create vite@latest my-app -- --template react-ts
cd my-app && npm install

# Or add to existing project
npm install react react-dom typescript vite
npm install -D @types/react @types/react-dom
```

### UI Framework (shadcn/ui)
```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Add components as needed
npx shadcn-ui@latest add button card dialog form input
npx shadcn-ui@latest add table tabs toast dropdown-menu
```

### Styling
```bash
npm install tailwindcss postcss autoprefixer
npm install clsx tailwind-merge class-variance-authority
npx tailwindcss init -p
```

### State & Data Fetching
```bash
npm install @tanstack/react-query zustand
npm install react-hook-form zod @hookform/resolvers
```

### Routing
```bash
npm install react-router-dom
```

### Icons
```bash
npm install lucide-react
```

### Full Install Command
```bash
npm install react react-dom react-router-dom @tanstack/react-query zustand react-hook-form zod @hookform/resolvers lucide-react clsx tailwind-merge class-variance-authority
npm install -D typescript @types/react @types/react-dom tailwindcss postcss autoprefixer vite
```

---

## Stack Info

| Tech | Version | Notes |
|------|---------|-------|
| React | 18.3.1 | Hooks, Suspense, lazy |
| Vite | 5.4.x | HMR, ESM |
| TypeScript | 5.x | Strict mode |
| TailwindCSS | 3.x | With shadcn/ui |
| shadcn/ui | Latest | Radix-based components |

## Lazy Loading Patterns

### CORRECT: File has default export
```typescript
// If file has: export default ComponentName
const Component = lazy(() => import('@/pages/Component'));

// Usage in routes
<Route path="/page" element={<Component />} />
```

### CORRECT: File has only named export
```typescript
// If file has: export const ComponentName = ...
// (no default export)
const Component = lazy(() =>
  import('@/pages/Component').then(m => ({ default: m.ComponentName }))
);
```

### WRONG: Causes "dispatcher is null"
```typescript
// DON'T use .then() transform when file already has default export
// This breaks React context chain!
const Component = lazy(() =>
  import('@/pages/Component').then(m => ({ default: m.ComponentName }))
);
// ^ This will cause: "can't access property useContext, dispatcher is null"
```

### How to Check
```bash
# Check if file has default export
grep -n "export default" src/pages/MyComponent.tsx
```

## Auth Context Patterns

### Multiple Auth Providers
```typescript
// When using multiple auth systems (e.g., Microsoft + Supabase)
const StaffLayout = () => {
  // Get both contexts
  const { user: msUser, logout: msLogout } = useMicrosoftAuth();
  const { user: supabaseUser, signOut: supabaseSignOut } = useAuth();

  // Prefer one, fallback to other
  const user = msUser || supabaseUser;

  const handleLogout = async () => {
    if (msUser) {
      await msLogout();
    } else if (supabaseUser) {
      await supabaseSignOut();
    }
    navigate('/login');
  };

  // ... rest of component
};
```

### Auth Loading States
```typescript
// Problem: Loading state hangs forever
// Solution: Add timeout fallback

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout');
        setLoadingTimeout(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [loading]);

  // Proceed if loaded OR timeout
  const isLoading = loading && !loadingTimeout;

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  return <Outlet />;
};
```

### Promise.allSettled for Resilience
```typescript
// Problem: Promise.all fails if ANY promise fails
// Solution: Use Promise.allSettled

const loadUserData = async (userId: string) => {
  const results = await Promise.allSettled([
    fetchUserProfile(userId),
    fetchStaffUser(userId),
    fetchPreferences(userId)
  ]);

  // Extract successful results safely
  const profile = results[0].status === 'fulfilled' ? results[0].value : null;
  const staffUser = results[1].status === 'fulfilled' ? results[1].value : null;
  const prefs = results[2].status === 'fulfilled' ? results[2].value : {};

  return { profile, staffUser, prefs };
};
```

## Error Boundaries

### Functional Wrapper with Navigation
```typescript
// ErrorBoundary is a class component, can't use hooks
// Solution: Wrap it in a functional component

const ErrorBoundaryWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleReset = () => {
    navigate('/');
  };

  return (
    <ErrorBoundary
      onReset={handleReset}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
          currentPath={location.pathname}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
```

## Vite Troubleshooting

### Clear Cache
```bash
# When you see weird module errors
rm -rf node_modules/.vite
npm run dev
```

### HMR Issues
```bash
# Check if Vite is picking up changes
# Look for: [vite] hmr update /src/file.tsx

# If not updating, try:
# 1. Save file again
# 2. Clear browser cache (Ctrl+Shift+R)
# 3. Restart dev server
```

### Dynamic Import Errors
```
TypeError: error loading dynamically imported module
```
**Causes:**
1. File doesn't exist at path
2. Syntax error in imported file
3. Vite cache corruption

**Fix:**
```bash
rm -rf node_modules/.vite
npm run build  # Verify no syntax errors
npm run dev
```

## shadcn/ui Patterns

### Adding Components
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
```

### Form with Validation
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const MyForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // handle submit
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* more fields */}
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};
```

## TypeScript Patterns

### Component Props
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading,
  children,
  ...props
}) => {
  // ...
};
```

### Generic Components
```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}
```

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `dispatcher is null` | Wrong lazy loading pattern | Use simple `lazy(() => import(...))` if file has default export |
| `Cannot read property of undefined` | Accessing state before loaded | Add loading checks, use optional chaining |
| `Too many re-renders` | State update in render | Move update to useEffect |
| `Module not found` | Wrong import path | Check `@/` alias in tsconfig |
| `Type error: X is not assignable` | TypeScript mismatch | Check interface definitions |

## Performance Tips

1. **Memoize expensive computations**
   ```typescript
   const expensive = useMemo(() => computeExpensive(data), [data]);
   ```

2. **Memoize callbacks passed to children**
   ```typescript
   const handleClick = useCallback(() => doSomething(id), [id]);
   ```

3. **Use React.memo for pure components**
   ```typescript
   const PureComponent = React.memo(({ data }) => <div>{data}</div>);
   ```

4. **Lazy load routes**
   ```typescript
   const AdminPage = lazy(() => import('@/pages/AdminPage'));
   ```

5. **Suspense with proper fallback**
   ```typescript
   <Suspense fallback={<PageSkeleton />}>
     <Routes>...</Routes>
   </Suspense>
   ```

## Integration with Puppeteer MCP

For visual QA, use the Puppeteer MCP:
```
mcp__puppeteer-mcp-claude__puppeteer_launch
mcp__puppeteer-mcp-claude__puppeteer_navigate
mcp__puppeteer-mcp-claude__puppeteer_screenshot
```

Workflow:
1. Start dev server: `npm run dev`
2. Launch Puppeteer
3. Navigate to page
4. Take screenshot for visual verification