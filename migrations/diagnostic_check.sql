-- DIAGNOSTIC: Check current visitor_events configuration
-- Run this FIRST to see what's currently configured

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'visitor_events'
) AS table_exists;

-- 2. Check RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'visitor_events';

-- 3. Check all policies
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

-- 4. Check table grants
SELECT
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'visitor_events'
ORDER BY grantee, privilege_type;

-- 5. Check schema grants
SELECT
  grantee,
  privilege_type
FROM information_schema.usage_privileges
WHERE object_schema = 'public'
AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee;
