-- SIMPLE FIX: Just check and recreate policies
-- First, let's see what policies exist right now

SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'visitor_events';

-- Now drop and recreate ONLY the policies (grants are already correct)

DROP POLICY IF EXISTS "anon_insert_policy" ON visitor_events;
DROP POLICY IF EXISTS "authenticated_select_policy" ON visitor_events;
DROP POLICY IF EXISTS "service_role_all_policy" ON visitor_events;

-- Create simple, permissive policies
CREATE POLICY "anon_insert_policy"
ON visitor_events
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "authenticated_select_policy"
ON visitor_events
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "service_role_all_policy"
ON visitor_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify they were created
SELECT 
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'visitor_events'
ORDER BY policyname;
