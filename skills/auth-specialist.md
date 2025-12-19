---
name: auth-specialist
description: Authentication specialist for login flows, portals, multi-provider auth. FIXES: infinite loading, context issues, RLS auth problems, timeout handling. Use when implementing or debugging auth.
---

# Authentication Specialist Skill

Specialized in fixing the most common auth problems based on real debugging sessions.

## CRITICAL: Common Problems & Solutions

### Problem 1: "Verifying auth" Infinite Loading

**Symptoms:**
- Page shows "Verifying authentication..." forever
- Console shows no errors
- User authenticated but stuck on loading

**Root Cause:** `Promise.all()` fails if ANY promise fails/hangs

**SOLUTION - AuthContext.tsx:**
```typescript
// BEFORE (BROKEN)
const loadUserData = async (user: User) => {
  const [profile, staffUser] = await Promise.all([
    fetchUserProfile(user.id),
    fetchStaffUser(user.id)
  ]);
  // If either fails, this never completes!
};

// AFTER (FIXED)
const loadUserData = async (user: User) => {
  const results = await Promise.allSettled([
    fetchUserProfile(user.id),
    fetchStaffUser(user.id)
  ]);

  // Extract safely
  const profile = results[0].status === 'fulfilled' ? results[0].value : null;
  const staffUser = results[1].status === 'fulfilled' ? results[1].value : null;

  setProfile(profile);
  setStaffUser(staffUser);
  setLoading(false); // ALWAYS set loading false
};
```

### Problem 2: ProtectedRoute Never Stops Loading

**Symptoms:**
- Route guard shows loading spinner forever
- Auth providers never finish loading

**SOLUTION - Add timeout fallback:**
```typescript
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Timeout fallback - proceed after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) {
        console.warn('Auth loading timeout - proceeding with current state');
        setLoadingTimeout(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [authLoading]);

  // Loading ends when auth finishes OR timeout
  const isLoading = authLoading && !loadingTimeout;

  if (isLoading) {
    return <LoadingSpinner message="Verifying authentication..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

### Problem 3: Multiple Auth Providers (Microsoft + Supabase)

**Symptoms:**
- Login works with one provider, logout doesn't
- Wrong user shown
- Conflicts between auth states

**SOLUTION - Unified auth handling:**
```typescript
// StaffLayout.tsx or similar
const Layout = () => {
  // Get BOTH auth contexts
  const { user: msUser, logout: msLogout } = useMicrosoftAuth();
  const { user: supabaseUser, signOut: supabaseSignOut } = useAuth();

  // Prefer Microsoft if both exist
  const user = msUser || supabaseUser;

  const handleLogout = async () => {
    try {
      if (msUser) {
        await msLogout();
      }
      if (supabaseUser) {
        await supabaseSignOut();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always navigate, even on error
      navigate('/login');
    }
  };

  // Helper functions that check both users
  const getUserEmail = () => {
    if (msUser) return msUser.username || msUser.email;
    if (supabaseUser) return supabaseUser.email;
    return '';
  };

  const getUserName = () => {
    if (msUser) return msUser.name || msUser.displayName;
    if (supabaseUser) return supabaseUser.user_metadata?.full_name || supabaseUser.email;
    return 'User';
  };

  // ... rest
};
```

### Problem 4: RLS Blocks Auth Check (Chicken-Egg)

**Symptoms:**
- `is_staff_user()` returns false even for staff
- Query to `staff_users` fails silently
- User can log in but can't access staff pages

**SOLUTION - Self-check RLS policy:**
```sql
-- Allow users to check their OWN staff status
CREATE POLICY "Users can check own staff status"
ON staff_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Then staff can see all staff
CREATE POLICY "Staff can view all staff"
ON staff_users
FOR SELECT
TO authenticated
USING (is_staff_user());
```

### Problem 5: Staff Check Uses Wrong Column

**Symptoms:**
- `column "active" does not exist`
- Staff users exist but not recognized

**SOLUTION - Fix the function:**
```sql
-- Check your column name!
-- Common mistake: 'active' vs 'is_active'

CREATE OR REPLACE FUNCTION is_staff_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff_users
    WHERE user_id = auth.uid()
    AND is_active = true  -- NOT 'active'!
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Complete Auth Template

### 1. AuthContext.tsx (Supabase)

```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### 2. LoginForm.tsx with Rate Limiting

```typescript
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useRateLimit } from '@/hooks/useRateLimit';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rate limiting: 5 attempts per 5 minutes
  const { isLocked, recordAttempt, getRemainingTime } = useRateLimit('login', 5, 5 * 60 * 1000);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    if (isLocked()) {
      const minutes = Math.ceil(getRemainingTime() / 60000);
      setError(`Too many attempts. Try again in ${minutes} minutes.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { error } = await signIn(data.email, data.password);

    if (error) {
      recordAttempt();
      // Safe error message - don't expose internal details
      setError('Invalid email or password');
    }

    setIsSubmitting(false);
  };

  if (isLocked()) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">Account temporarily locked</p>
        <p>Try again in {Math.ceil(getRemainingTime() / 60000)} minutes</p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div>
        <label>Email</label>
        <input
          type="email"
          {...form.register('email')}
          className="w-full border rounded p-2"
        />
        {form.formState.errors.email && (
          <span className="text-red-500 text-sm">
            {form.formState.errors.email.message}
          </span>
        )}
      </div>

      <div>
        <label>Password</label>
        <input
          type="password"
          {...form.register('password')}
          className="w-full border rounded p-2"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-500 text-white p-2 rounded disabled:opacity-50"
      >
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
};
```

### 3. ProtectedRoute.tsx (Robust)

```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireStaff?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  requireStaff = false,
  redirectTo = '/login'
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // 5-second timeout fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) {
        console.warn('[ProtectedRoute] Auth timeout - proceeding');
        setLoadingTimeout(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [authLoading]);

  const isLoading = authLoading && !loadingTimeout;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="mt-2">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If staff required, check staff status
  // (You'd need to pass staffUser from context or check here)

  return <>{children}</>;
};
```

### 4. Supabase Migrations for Auth

```sql
-- supabase/migrations/XXXX_auth_setup.sql

-- Staff users table
CREATE TABLE IF NOT EXISTS staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'staff',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION is_staff_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Self-check policy (CRITICAL - avoids chicken-egg)
CREATE POLICY "Users can check own staff status"
ON staff_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Staff can view all staff
CREATE POLICY "Staff can view all staff"
ON staff_users FOR SELECT
TO authenticated
USING (is_staff_user());

-- Create index
CREATE INDEX idx_staff_users_user_id ON staff_users(user_id);
CREATE INDEX idx_staff_users_email ON staff_users(email);
```

## Testing Auth with Puppeteer MCP

Use the puppeteer MCP to test login flows:

```javascript
// Test login flow
1. puppeteer_launch({ headless: false })
2. puppeteer_new_page({ pageId: "auth-test" })
3. puppeteer_navigate({ pageId: "auth-test", url: "http://localhost:5173/login" })
4. puppeteer_type({ pageId: "auth-test", selector: "input[name='email']", text: "test@example.com" })
5. puppeteer_type({ pageId: "auth-test", selector: "input[name='password']", text: "password123" })
6. puppeteer_click({ pageId: "auth-test", selector: "button[type='submit']" })
7. puppeteer_wait_for_selector({ pageId: "auth-test", selector: ".dashboard" })
8. puppeteer_screenshot({ pageId: "auth-test", path: "/tmp/login-success.png" })
```

## Debugging Checklist

### When Login Doesn't Work:
1. [ ] Check browser console for errors
2. [ ] Check Network tab for failed requests
3. [ ] Verify Supabase credentials in `.env`
4. [ ] Test Supabase connection: `supabase.auth.getSession()`
5. [ ] Check RLS policies on user-related tables

### When Page Hangs on Loading:
1. [ ] Add console.log in AuthContext state changes
2. [ ] Check if `loading` state ever becomes `false`
3. [ ] Look for `Promise.all()` that should be `Promise.allSettled()`
4. [ ] Add timeout fallback to protected routes
5. [ ] Check for uncaught promise rejections

### When Logout Doesn't Work:
1. [ ] Check which auth provider user used to login
2. [ ] Verify both contexts are imported in layout
3. [ ] Add `finally` block to always navigate

### When Staff Access Fails:
1. [ ] Run: `SELECT * FROM staff_users WHERE email = 'user@email.com'`
2. [ ] Check `is_active` column (not `active`)
3. [ ] Verify RLS policy allows self-check
4. [ ] Test: `SELECT is_staff_user()` in SQL Editor

## Integration with Other Skills

- **supabase-expert**: For RLS and migration help
- **react-expert**: For context and component patterns
- **security-audit**: For auth security review
- **devops**: For deployment of auth services