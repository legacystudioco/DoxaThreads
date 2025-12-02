-- ============================================
-- TEMPORARY: Disable RLS to verify tracking works
-- ============================================
-- This will allow us to confirm that the tracking
-- code itself works. We can re-enable RLS after.
-- ============================================

-- Disable RLS on visitor_events table
ALTER TABLE visitor_events DISABLE ROW LEVEL SECURITY;

-- Check the status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'visitor_events';

-- ============================================
-- After running this:
-- 1. Test visitor tracking - it should work
-- 2. Check analytics - you should see data
-- 3. Then we can re-enable RLS with proper policies
-- ============================================
