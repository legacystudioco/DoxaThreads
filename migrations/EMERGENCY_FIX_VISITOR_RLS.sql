-- EMERGENCY FIX: Visitor Events RLS Policy
-- This fixes the "new row violates row-level security policy" error
-- Run this in your Supabase SQL Editor

BEGIN;

-- Step 1: Drop ALL existing policies on visitor_events
DROP POLICY IF EXISTS "anon_insert_policy" ON visitor_events;
DROP POLICY IF EXISTS "authenticated_select_policy" ON visitor_events;
DROP POLICY IF EXISTS "service_role_all_policy" ON visitor_events;
DROP POLICY IF EXISTS "Enable insert for anon" ON visitor_events;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON visitor_events;
DROP POLICY IF EXISTS "Enable all for service role" ON visitor_events;

-- Step 2: Ensure RLS is enabled
ALTER TABLE visitor_events ENABLE ROW LEVEL SECURITY;

-- Step 3: Create NEW permissive policies that actually work
-- Allow anonymous users to INSERT
CREATE POLICY "allow_anon_insert"
ON visitor_events
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow authenticated users to SELECT
CREATE POLICY "allow_authenticated_select"
ON visitor_events
FOR SELECT
TO authenticated
USING (true);

-- Allow service_role to do everything
CREATE POLICY "allow_service_all"
ON visitor_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;

-- Verification
SELECT 'RLS STATUS:' AS info;
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'visitor_events';

SELECT 'POLICIES:' AS info;
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'visitor_events';
