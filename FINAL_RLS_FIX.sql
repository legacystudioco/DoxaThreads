-- ============================================
-- FINAL RLS FIX FOR VISITOR_EVENTS
-- ============================================
-- This script will properly configure RLS policies
-- that work with Supabase's role system
-- ============================================

-- Step 1: Drop ALL existing policies (clean slate)
DO $$
BEGIN
    -- Drop all policies on visitor_events
    DROP POLICY IF EXISTS "allow_anonymous_inserts" ON visitor_events;
    DROP POLICY IF EXISTS "allow_authenticated_reads" ON visitor_events;
    DROP POLICY IF EXISTS "allow_service_role_all" ON visitor_events;
    DROP POLICY IF EXISTS "enable_insert_for_anon" ON visitor_events;
    DROP POLICY IF EXISTS "enable_select_for_authenticated" ON visitor_events;
    DROP POLICY IF EXISTS "enable_all_for_service_role" ON visitor_events;
    DROP POLICY IF EXISTS "Allow public insert" ON visitor_events;
    DROP POLICY IF EXISTS "Allow authenticated read" ON visitor_events;
    DROP POLICY IF EXISTS "Public can insert visitor events" ON visitor_events;
    DROP POLICY IF EXISTS "Authenticated can read visitor events" ON visitor_events;
END $$;

-- Step 2: Enable RLS
ALTER TABLE visitor_events ENABLE ROW LEVEL SECURITY;

-- Step 3: Grant table permissions to roles
GRANT INSERT ON visitor_events TO anon;
GRANT INSERT ON visitor_events TO authenticated;
GRANT SELECT ON visitor_events TO authenticated;
GRANT ALL ON visitor_events TO service_role;

-- Step 4: Create simple, permissive policies

-- Allow anyone (anon, authenticated, public) to INSERT
CREATE POLICY "visitor_insert_policy"
ON visitor_events
FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to SELECT
CREATE POLICY "visitor_select_policy"
ON visitor_events
FOR SELECT
TO authenticated
USING (true);

-- Step 5: Verify setup
SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'visitor_events'
ORDER BY policyname;

-- Step 6: Test grants
SELECT
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'visitor_events'
ORDER BY grantee, privilege_type;

-- ============================================
-- Expected output:
-- You should see:
-- 1. visitor_insert_policy - with CHECK (true)
-- 2. visitor_select_policy - TO authenticated USING (true)
--
-- Grants should show:
-- - anon: INSERT
-- - authenticated: INSERT, SELECT
-- - service_role: ALL
-- ============================================
