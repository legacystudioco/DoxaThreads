-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL, -- For percentage: 25 = 25%, For fixed: amount in cents
  max_uses INTEGER, -- NULL = unlimited uses
  used_count INTEGER DEFAULT 0,
  first_order_only BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on code for fast lookups
CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(active);

-- Insert the HELLOFRIEND discount code
INSERT INTO discount_codes (code, discount_type, discount_value, first_order_only, active)
VALUES ('HELLOFRIEND', 'percentage', 25, true, true)
ON CONFLICT (code) DO NOTHING;

-- Enable RLS
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active discount codes
CREATE POLICY "Public can read active discount codes"
  ON discount_codes FOR SELECT
  USING (active = true);

-- Only service role can update discount codes
CREATE POLICY "Service role can update discount codes"
  ON discount_codes FOR UPDATE
  USING (auth.jwt()->>'role' = 'service_role');

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_discount_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER discount_codes_updated_at
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_discount_codes_updated_at();

COMMENT ON TABLE discount_codes IS 'Stores discount codes for promotional campaigns';
COMMENT ON COLUMN discount_codes.code IS 'The discount code text (e.g., HELLOFRIEND)';
COMMENT ON COLUMN discount_codes.discount_type IS 'Either percentage or fixed amount';
COMMENT ON COLUMN discount_codes.discount_value IS 'For percentage: 25 = 25%, For fixed: amount in cents';
COMMENT ON COLUMN discount_codes.first_order_only IS 'If true, only applies to customers first order';
