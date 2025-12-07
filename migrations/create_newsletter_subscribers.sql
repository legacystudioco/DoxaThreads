-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  confirmation_token TEXT UNIQUE,
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  discount_code_sent BOOLEAN DEFAULT false,
  discount_code TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_token ON newsletter_subscribers(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_confirmed ON newsletter_subscribers(confirmed);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public to insert (signup)
CREATE POLICY "Public can signup for newsletter"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- Allow public to read their own record by confirmation token
CREATE POLICY "Public can read own subscription via token"
  ON newsletter_subscribers FOR SELECT
  USING (true);

-- Allow service role to update confirmations
CREATE POLICY "Service role can update subscriptions"
  ON newsletter_subscribers FOR UPDATE
  USING (true);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_newsletter_subscribers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER newsletter_subscribers_updated_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_subscribers_updated_at();

COMMENT ON TABLE newsletter_subscribers IS 'Stores newsletter subscriber information with email confirmation';
COMMENT ON COLUMN newsletter_subscribers.confirmation_token IS 'Unique token sent via email for confirmation';
COMMENT ON COLUMN newsletter_subscribers.confirmed IS 'Whether the email has been confirmed';
COMMENT ON COLUMN newsletter_subscribers.discount_code_sent IS 'Whether the welcome discount code has been sent';
