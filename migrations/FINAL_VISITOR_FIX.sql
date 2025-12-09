-- FINAL FIX: Drop everything and recreate cleanly
-- This will definitely fix the visitor_events RLS issue

BEGIN;

-- Step 1: Drop ALL existing policies
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'visitor_events'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON visitor_events', pol.policyname);
    END LOOP;
END $$;

-- Step 2: Disable RLS temporarily
ALTER TABLE visitor_events DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE visitor_events ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, working policies
CREATE POLICY "visitor_events_anon_insert"
ON visitor_events
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "visitor_events_authenticated_insert"
ON visitor_events
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "visitor_events_authenticated_select"
ON visitor_events
FOR SELECT
TO authenticated
USING (true);

COMMIT;

-- Verify
SELECT 'Policies created:' as status;
SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'visitor_events' ORDER BY policyname;
