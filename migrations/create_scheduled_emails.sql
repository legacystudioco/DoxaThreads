-- Create scheduled_emails table for bulk email scheduling
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  scheduled_datetime TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_by TEXT
);

-- Create index on scheduled_datetime for efficient querying
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_datetime ON scheduled_emails(scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON scheduled_emails(status);

-- Add RLS policies
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

-- Policy to allow studio users to view all scheduled emails
CREATE POLICY "Allow studio users to view scheduled emails"
  ON scheduled_emails
  FOR SELECT
  USING (true);

-- Policy to allow studio users to insert scheduled emails
CREATE POLICY "Allow studio users to insert scheduled emails"
  ON scheduled_emails
  FOR INSERT
  WITH CHECK (true);

-- Policy to allow studio users to update scheduled emails
CREATE POLICY "Allow studio users to update scheduled emails"
  ON scheduled_emails
  FOR UPDATE
  USING (true);

-- Policy to allow studio users to delete scheduled emails
CREATE POLICY "Allow studio users to delete scheduled emails"
  ON scheduled_emails
  FOR DELETE
  USING (true);
