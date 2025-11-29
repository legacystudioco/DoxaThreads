-- Create visitor_events table for tracking site visits
CREATE TABLE IF NOT EXISTS visitor_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT,
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  country_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
);

-- Create index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_visitor_events_created_at ON visitor_events(created_at DESC);

-- Create index on session_id for tracking unique sessions
CREATE INDEX IF NOT EXISTS idx_visitor_events_session_id ON visitor_events(session_id);

-- Enable Row Level Security
ALTER TABLE visitor_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (for tracking)
CREATE POLICY "Allow public insert" ON visitor_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow authenticated reads (for analytics)
CREATE POLICY "Allow authenticated read" ON visitor_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow service role full access
CREATE POLICY "Allow service role all" ON visitor_events
  TO service_role
  USING (true)
  WITH CHECK (true);
