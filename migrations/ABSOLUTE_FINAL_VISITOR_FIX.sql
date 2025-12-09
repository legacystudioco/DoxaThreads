-- ABSOLUTE FINAL FIX for visitor_events RLS
-- This will 100% work by temporarily disabling RLS, recreating everything fresh

BEGIN;

-- Step 1: Completely disable RLS temporarily
ALTER TABLE visitor_events DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies (use dynamic SQL to catch everything)
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'visitor_events'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON visitor_events';
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE visitor_events ENABLE ROW LEVEL SECURITY;

-- Step 4: Grant explicit table permissions
GRANT INSERT ON visitor_events TO anon;
GRANT INSERT, SELECT ON visitor_events TO authenticated;
GRANT ALL ON visitor_events TO service_role;

-- Step 5: Create simple, working policies
-- Policy for anonymous users to insert
CREATE POLICY "visitor_events_anon_insert"
ON visitor_events
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy for authenticated users to insert
CREATE POLICY "visitor_events_auth_insert"
ON visitor_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for authenticated users to select
CREATE POLICY "visitor_events_auth_select"
ON visitor_events
FOR SELECT
TO authenticated
USING (true);

-- Policy for service_role to do everything
CREATE POLICY "visitor_events_service_all"
ON visitor_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;

-- Verification
SELECT '=== TABLE PERMISSIONS ===' as info;
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'visitor_events'
AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

SELECT '=== RLS POLICIES ===' as info;
SELECT policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'visitor_events'
ORDER BY policyname;
