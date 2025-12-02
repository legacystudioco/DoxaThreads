-- ============================================
-- FIX VISITOR TRACKING - RLS POLICY UPDATE
-- ============================================
-- Problem: visitor_events table blocks anonymous inserts
-- Solution: Update RLS policies to allow public inserts
-- Run this in your Supabase SQL Editor NOW
-- ============================================

-- Step 1: Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Allow public insert" ON visitor_events;
DROP POLICY IF EXISTS "Allow authenticated read" ON visitor_events;
DROP POLICY IF EXISTS "Allow service role all" ON visitor_events;
DROP POLICY IF EXISTS "Public can insert visitor events" ON visitor_events;
DROP POLICY IF EXISTS "Authenticated can read visitor events" ON visitor_events;
DROP POLICY IF EXISTS "Service role full access" ON visitor_events;

-- Step 2: Keep RLS enabled (security best practice)
ALTER TABLE visitor_events ENABLE ROW LEVEL SECURITY;

-- Step 3: Create NEW policies that actually work

-- Policy 1: Allow ANYONE (anon + public) to INSERT visitor events
-- This is what was missing! The old policy wasn't working.
CREATE POLICY "allow_anonymous_inserts"
ON visitor_events
FOR INSERT
TO anon, public, authenticated
WITH CHECK (true);

-- Policy 2: Allow authenticated users (logged in to /studio) to SELECT
CREATE POLICY "allow_authenticated_reads"
ON visitor_events
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Service role gets full access (for server-side operations)
CREATE POLICY "allow_service_role_all"
ON visitor_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 4: Verify the policies were created
SELECT
  schemaname,
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

-- ============================================
-- After running this, test with:
-- node test-visitor-insert.js
-- ============================================
