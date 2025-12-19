---
name: supabase-expert
description: Supabase expert for RLS policies, migrations, auth debugging, and database operations. Use when dealing with permissions, auth issues, or database schema.
---

# Supabase Expert Skill

Expert knowledge for Supabase: RLS, migrations, auth, Edge Functions.

## Connection Info

```bash
# Project: matwal-premium
# Host: db.ieqizooravdkcyujgiot.supabase.co
# Pooler: aws-0-us-west-1.pooler.supabase.com:6543

# Quick connection test
PGPASSWORD='MatwalPremium2025!Secure#DB' psql \
  "postgresql://postgres.ieqizooravdkcyujgiot:MatwalPremium2025%21Secure%23DB@aws-0-us-west-1.pooler.supabase.com:6543/postgres" \
  -c "SELECT 'Connected!' as status;"
```

## RLS Policy Patterns

### 1. Staff Access Pattern
```sql
-- Helper function
CREATE OR REPLACE FUNCTION is_staff_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff_users
    WHERE user_id = auth.uid()
    AND is_active = true  -- NOT 'active', use 'is_active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy
CREATE POLICY "Staff can view all"
ON table_name FOR SELECT
TO authenticated
USING (is_staff_user());
```

### 2. Family Isolation Pattern
```sql
-- Helper function
CREATE OR REPLACE FUNCTION get_user_family_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT family_id FROM user_profiles
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy
CREATE POLICY "Users see own family data"
ON table_name FOR SELECT
TO authenticated
USING (family_id = get_user_family_id());
```

### 3. Soft Delete Pattern
```sql
-- Add column
ALTER TABLE table_name ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Partial index for performance
CREATE INDEX idx_table_active ON table_name(id) WHERE deleted_at IS NULL;

-- Policy excludes deleted
CREATE POLICY "Exclude deleted"
ON table_name FOR SELECT
TO authenticated
USING (deleted_at IS NULL AND ...other_conditions...);

-- Soft delete function
CREATE OR REPLACE FUNCTION soft_delete(table_name TEXT, record_id UUID)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('UPDATE %I SET deleted_at = NOW() WHERE id = %L', table_name, record_id);
END;
$$ LANGUAGE plpgsql;
```

### 4. Self-Check Pattern (for staff_users chicken-egg)
```sql
-- Allow users to check their own staff status
CREATE POLICY "Users can check own staff status"
ON staff_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

### 5. Combined Pattern (Staff OR Owner)
```sql
CREATE POLICY "Staff or owner access"
ON table_name FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND (
    is_staff_user()
    OR family_id = get_user_family_id()
    OR created_by = auth.uid()
  )
);
```

## Migration Best Practices

### Creating Migrations
```bash
# Create new migration
supabase migration new descriptive_name

# Edit the file
# supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql
```

### Migration Template
```sql
-- Migration: descriptive_name
-- Description: What this migration does

-- 1. Add columns (IF NOT EXISTS for safety)
ALTER TABLE table_name
ADD COLUMN IF NOT EXISTS new_column TYPE DEFAULT value;

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column);

-- 3. Add constraints
ALTER TABLE table_name
ADD CONSTRAINT constraint_name CHECK (condition);

-- 4. Create/update functions
CREATE OR REPLACE FUNCTION func_name()
RETURNS TYPE AS $$
BEGIN
  -- logic
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create policies (drop first if replacing)
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ON table_name
FOR operation TO role USING (condition);

-- 6. Enable RLS if not already
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Pushing Migrations
```bash
# With access token
SUPABASE_ACCESS_TOKEN='sbp_xxx' supabase db push --linked

# If migration fails, repair
supabase migration repair MIGRATION_NAME --status applied
```

## Auth Debugging

### Check User in Database
```sql
-- Find user by email
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
WHERE email = 'user@example.com';

-- Check user metadata
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE id = 'uuid';

-- Check if user is staff
SELECT * FROM staff_users WHERE user_id = 'uuid';
```

### Common Auth Issues

1. **"is_staff_user() returns false"**
   - Check `staff_users` table has entry
   - Verify `is_active = true` (not `active`)
   - Check `user_id` matches `auth.users.id`

2. **"RLS policy blocks access"**
   - Test policy with: `SELECT * FROM table LIMIT 1`
   - Check `auth.uid()` returns expected value
   - Verify helper functions work: `SELECT is_staff_user()`

3. **"Column does not exist"**
   - Policy references non-existent column
   - Run: `\d table_name` to see actual columns
   - Update policy to use correct column names

### Debug Queries
```sql
-- Current user ID
SELECT auth.uid();

-- Current user role
SELECT auth.role();

-- Check RLS policies on table
SELECT * FROM pg_policies WHERE tablename = 'table_name';

-- Test if user passes policy
SELECT * FROM table_name LIMIT 1;  -- Will fail if RLS blocks
```

## Seeding Data (Bypass RLS)

### SQL Editor Method (Recommended)
```sql
-- Temporarily disable RLS
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Insert data
INSERT INTO table_name (...) VALUES (...);

-- Re-enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Service Role Key Method
```javascript
const supabase = createClient(url, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});
// This bypasses RLS
await supabase.from('table').insert(data);
```

## Edge Functions

### Create Function
```bash
supabase functions new function-name
# Edit: supabase/functions/function-name/index.ts
```

### Function Template
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Your logic here

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Deploy
```bash
supabase functions deploy function-name
supabase secrets set API_KEY=value
```

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `column "active" does not exist` | Wrong column name | Use `is_active` |
| `violates row-level security` | RLS blocking | Check policies, use service role for seeding |
| `violates check constraint` | Invalid value | Check constraint: `\d table_name` |
| `permission denied for schema` | Missing grants | `GRANT USAGE ON SCHEMA public TO authenticated;` |
| `function does not exist` | Not created yet | Run migration with function definition |

## Performance Tips

1. **Use partial indexes** for soft delete:
   ```sql
   CREATE INDEX idx_active ON table(id) WHERE deleted_at IS NULL;
   ```

2. **Index foreign keys** used in RLS:
   ```sql
   CREATE INDEX idx_family ON table(family_id);
   ```

3. **Use SECURITY DEFINER** for helper functions to avoid permission issues

4. **Avoid complex RLS** with many JOINs - use denormalized columns if needed