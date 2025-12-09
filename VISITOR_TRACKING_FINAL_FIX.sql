-- ========================================
-- VISITOR TRACKING FINAL FIX
-- This solves the RLS error: "Anonymous users cannot insert into visitor_events"
-- ========================================

-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/editor

BEGIN;

-- 1. Disable RLS temporarily
ALTER TABLE IF EXISTS visitor_events DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'visitor_events'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON visitor_events';
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- 3. Re-enable RLS
ALTER TABLE visitor_events ENABLE ROW LEVEL SECURITY;

-- 4. Grant explicit permissions on the table itself
GRANT INSERT ON visitor_events TO anon;
GRANT INSERT, SELECT ON visitor_events TO authenticated;
GRANT ALL ON visitor_events TO service_role;

-- 5. Create simple, permissive policies

-- Anonymous users can insert
CREATE POLICY "visitor_events_anon_insert"
ON visitor_events
FOR INSERT
TO anon
WITH CHECK (true);

-- Authenticated users can insert
CREATE POLICY "visitor_events_auth_insert"
ON visitor_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can select their own data
CREATE POLICY "visitor_events_auth_select"
ON visitor_events
FOR SELECT
TO authenticated
USING (true);

-- Service role has full access
CREATE POLICY "visitor_events_service_all"
ON visitor_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check table permissions
SELECT 
    '=== TABLE PERMISSIONS ===' as section,
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
    AND table_name = 'visitor_events'
    AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- Check RLS policies
SELECT 
    '=== RLS POLICIES ===' as section,
    policyname as policy_name,
    roles,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'visitor_events'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 
    '=== RLS STATUS ===' as section,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
    AND tablename = 'visitor_events';
