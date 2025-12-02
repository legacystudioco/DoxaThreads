-- CRITICAL FIX: Visitor Events Table and Policies
-- Run this in your Supabase SQL Editor

-- First, let's make sure the table exists
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_visitor_events_created_at ON visitor_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_events_session_id ON visitor_events(session_id);

-- CRITICAL: Drop all existing policies first
DROP POLICY IF EXISTS "Allow public insert" ON visitor_events;
DROP POLICY IF EXISTS "Allow authenticated read" ON visitor_events;
DROP POLICY IF EXISTS "Allow service role all" ON visitor_events;
DROP POLICY IF EXISTS "Public can insert visitor events" ON visitor_events;
DROP POLICY IF EXISTS "Authenticated can read visitor events" ON visitor_events;

-- Enable RLS
ALTER TABLE visitor_events ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Create permissive policy for anonymous inserts
CREATE POLICY "Public can insert visitor events"
ON visitor_events
FOR INSERT
TO anon, public
WITH CHECK (true);

-- Allow authenticated users to read
CREATE POLICY "Authenticated can read visitor events"
ON visitor_events
FOR SELECT
TO authenticated
USING (true);

-- Service role gets full access
CREATE POLICY "Service role full access"
ON visitor_events
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'visitor_events';
