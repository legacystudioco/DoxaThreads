-- TEST: Try to insert as anon role directly in SQL
-- This will prove whether the RLS policies are working

SET ROLE anon;

INSERT INTO visitor_events (
  session_id,
  page_path,
  referrer,
  city,
  country
) VALUES (
  'test_session_123',
  '/test',
  'https://google.com',
  'TestCity',
  'TestCountry'
);

-- Reset role
RESET ROLE;

-- Check if it was inserted
SELECT * FROM visitor_events WHERE session_id = 'test_session_123';
