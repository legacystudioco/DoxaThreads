-- FINAL FIX: Visitor Events RLS Policy for Anonymous Users
-- This migration fixes the "42501 Unauthorized" error
-- Run this in your Supabase SQL Editor

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Allow public insert" ON visitor_events;
DROP POLICY IF EXISTS "Allow authenticated read" ON visitor_events;
DROP POLICY IF EXISTS "Allow service role all" ON visitor_events;
DROP POLICY IF EXISTS "Public can insert visitor events" ON visitor_events;
DROP POLICY IF EXISTS "Authenticated can read visitor events" ON visitor_events;
DROP POLICY IF EXISTS "Service role full access" ON visitor_events;
DROP POLICY IF EXISTS "visitor_insert_policy" ON visitor_events;
DROP POLICY IF EXISTS "visitor_select_policy" ON visitor_events;

-- Ensure RLS is enabled
ALTER TABLE visitor_events ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Create policy that allows ANONYMOUS (anon) role to INSERT
CREATE POLICY "anon_can_insert_visitor_events"
ON visitor_events
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow authenticated users to SELECT (for analytics dashboard)
CREATE POLICY "authenticated_can_select_visitor_events"
ON visitor_events
FOR SELECT
TO authenticated
USING (true);

-- Service role gets full access
CREATE POLICY "service_role_full_access"
ON visitor_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify the policies
SELECT
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'visitor_events'
ORDER BY policyname;
