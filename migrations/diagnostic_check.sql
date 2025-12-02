-- Quick diagnostic query
-- Run this in Supabase SQL Editor to see what's going on

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'visitor_events'
) AS table_exists;

-- 2. Check RLS policies
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
WHERE tablename = 'visitor_events';

-- 3. Count records
SELECT COUNT(*) as total_records FROM visitor_events;

-- 4. Check recent records (if any)
SELECT 
  created_at,
  session_id,
  page_path,
  city,
  region,
  country
FROM visitor_events 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Test if anon can insert (this should work after running fix_visitor_events_rls.sql)
SET ROLE anon;
INSERT INTO visitor_events (session_id, page_path, city, region, country) 
VALUES ('test_session', '/test', 'Test City', 'Test Region', 'Test Country');
RESET ROLE;

-- 6. Clean up test record
DELETE FROM visitor_events WHERE session_id = 'test_session';
