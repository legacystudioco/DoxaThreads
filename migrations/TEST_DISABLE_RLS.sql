-- TEMPORARY TEST: Disable RLS to confirm that's the problem
-- WARNING: This makes the table completely open - only for testing!

ALTER TABLE visitor_events DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'visitor_events';
