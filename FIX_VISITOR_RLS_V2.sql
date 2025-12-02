-- ============================================
-- FIX VISITOR TRACKING - RLS POLICY UPDATE V2
-- ============================================
-- The first attempt created policies but the anon role
-- is not properly included. This version fixes that.
-- ============================================

-- Step 1: Drop ALL existing policies
DROP POLICY IF EXISTS "allow_anonymous_inserts" ON visitor_events;
DROP POLICY IF EXISTS "allow_authenticated_reads" ON visitor_events;
DROP POLICY IF EXISTS "allow_service_role_all" ON visitor_events;
DROP POLICY IF EXISTS "Allow public insert" ON visitor_events;
DROP POLICY IF EXISTS "Allow authenticated read" ON visitor_events;
DROP POLICY IF EXISTS "Allow service role all" ON visitor_events;
DROP POLICY IF EXISTS "Public can insert visitor events" ON visitor_events;
DROP POLICY IF EXISTS "Authenticated can read visitor events" ON visitor_events;
DROP POLICY IF EXISTS "Service role full access" ON visitor_events;

-- Step 2: Disable RLS temporarily to test
ALTER TABLE visitor_events DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE visitor_events ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policy that explicitly allows anon role
-- IMPORTANT: anon is the role used by unauthenticated clients
CREATE POLICY "enable_insert_for_anon"
ON visitor_events
FOR INSERT
TO anon
WITH CHECK (true);

-- Step 5: Allow authenticated users to select
CREATE POLICY "enable_select_for_authenticated"
ON visitor_events
FOR SELECT
TO authenticated
USING (true);

-- Step 6: Service role gets everything
CREATE POLICY "enable_all_for_service_role"
ON visitor_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 7: Verify policies
SELECT
  tablename,
  policyname,
  roles,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'visitor_events'
ORDER BY policyname;

-- ============================================
-- Expected output:
-- You should see 3 policies:
-- 1. enable_insert_for_anon - roles: {anon}
-- 2. enable_select_for_authenticated - roles: {authenticated}
-- 3. enable_all_for_service_role - roles: {service_role}
-- ============================================
