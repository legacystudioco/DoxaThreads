-- CLEANUP: Remove ALL visitor_events policies and create clean set
-- Run this in your Supabase SQL Editor

BEGIN;

-- Drop ALL policies (including the duplicates)
DROP POLICY IF EXISTS "anon_can_insert_visitor_events" ON visitor_events;
DROP POLICY IF EXISTS "authenticated_can_select_visitor_events" ON visitor_events;
DROP POLICY IF EXISTS "service_role_full_access" ON visitor_events;
DROP POLICY IF EXISTS "anon_insert_policy" ON visitor_events;
DROP POLICY IF EXISTS "authenticated_select_policy" ON visitor_events;
DROP POLICY IF EXISTS "service_role_all_policy" ON visitor_events;
DROP POLICY IF EXISTS "allow_anon_insert" ON visitor_events;
DROP POLICY IF EXISTS "allow_authenticated_select" ON visitor_events;
DROP POLICY IF EXISTS "allow_service_all" ON visitor_events;

-- Create ONE clean set of policies
CREATE POLICY "anon_insert_visitor_events"
ON visitor_events
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "authenticated_select_visitor_events"
ON visitor_events
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "service_role_all_visitor_events"
ON visitor_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;

-- Verification
SELECT 'Final Policy Count (should be 3):' AS info;
SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'visitor_events';

SELECT 'Final Policies:' AS info;
SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'visitor_events' ORDER BY policyname;
