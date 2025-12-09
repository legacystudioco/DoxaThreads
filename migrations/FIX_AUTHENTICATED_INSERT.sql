-- FIX: Allow authenticated users to INSERT into visitor_events too
-- The issue is that authenticated users (logged into studio) can't track visits
-- Run this in your Supabase SQL Editor

BEGIN;

-- Add INSERT policy for authenticated users
CREATE POLICY "authenticated_insert_visitor_events"
ON visitor_events
FOR INSERT
TO authenticated
WITH CHECK (true);

COMMIT;

-- Verification
SELECT 'Policies for visitor_events:' AS info;
SELECT policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'visitor_events'
ORDER BY roles, cmd;
