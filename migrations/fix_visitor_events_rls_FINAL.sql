-- ABSOLUTE FINAL FIX: Visitor Events RLS Policy for Anonymous Users
-- This migration fixes the "42501 Unauthorized" and "403 Forbidden" errors
-- Run this ENTIRE script in your Supabase SQL Editor

BEGIN;

-- Step 1: Drop ALL existing policies to start fresh
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'visitor_events') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON visitor_events';
    END LOOP;
END $$;

-- Step 2: Ensure the table exists with correct structure
CREATE TABLE IF NOT EXISTS visitor_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT,
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  country_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_visitor_events_created_at ON visitor_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_events_session_id ON visitor_events(session_id);

-- Step 4: CRITICAL - Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Step 5: CRITICAL - Grant table-level permissions
GRANT INSERT ON TABLE visitor_events TO anon;
GRANT SELECT ON TABLE visitor_events TO authenticated;
GRANT ALL ON TABLE visitor_events TO service_role;

-- Step 6: Enable RLS
ALTER TABLE visitor_events ENABLE ROW LEVEL SECURITY;

-- Step 7: Force RLS even for table owner (critical for Supabase)
ALTER TABLE visitor_events FORCE ROW LEVEL SECURITY;

-- Step 8: Create permissive policies
CREATE POLICY "anon_insert_policy"
ON visitor_events
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "authenticated_select_policy"
ON visitor_events
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "service_role_all_policy"
ON visitor_events
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;

-- Verification queries
SELECT '=== RLS STATUS ===' AS info;
SELECT tablename, rowsecurity AS rls_enabled FROM pg_tables WHERE tablename = 'visitor_events';

SELECT '=== POLICIES ===' AS info;
SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'visitor_events' ORDER BY policyname;

SELECT '=== TABLE GRANTS ===' AS info;
SELECT grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_name = 'visitor_events'
ORDER BY grantee, privilege_type;
