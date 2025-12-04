-- Create email_campaigns table to track bulk email campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  from_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'paused', 'completed', 'failed')),

  -- Campaign settings
  max_per_batch INTEGER DEFAULT 300,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Progress tracking
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,

  created_by TEXT
);

-- Create campaign_recipients table to track individual email sends
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,

  -- Contact info (denormalized for historical tracking)
  contact_id TEXT NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,

  -- Send status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,

  -- Resend metadata
  resend_email_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_email ON campaign_recipients(campaign_id, email);

-- Add RLS policies for email_campaigns
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow studio users to view campaigns"
  ON email_campaigns
  FOR SELECT
  USING (true);

CREATE POLICY "Allow studio users to insert campaigns"
  ON email_campaigns
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow studio users to update campaigns"
  ON email_campaigns
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow studio users to delete campaigns"
  ON email_campaigns
  FOR DELETE
  USING (true);

-- Add RLS policies for campaign_recipients
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow studio users to view campaign recipients"
  ON campaign_recipients
  FOR SELECT
  USING (true);

CREATE POLICY "Allow studio users to insert campaign recipients"
  ON campaign_recipients
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow studio users to update campaign recipients"
  ON campaign_recipients
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow studio users to delete campaign recipients"
  ON campaign_recipients
  FOR DELETE
  USING (true);
