-- Add discount columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS discount_code TEXT,
ADD COLUMN IF NOT EXISTS discount_cents INTEGER DEFAULT 0;

-- Add index on discount_code for reporting
CREATE INDEX IF NOT EXISTS idx_orders_discount_code ON orders(discount_code) WHERE discount_code IS NOT NULL;

-- Create a function to safely increment discount code usage
CREATE OR REPLACE FUNCTION increment_discount_usage(code_text TEXT)
RETURNS void AS $$
BEGIN
  UPDATE discount_codes
  SET used_count = used_count + 1
  WHERE LOWER(code) = LOWER(code_text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN orders.discount_code IS 'The discount code applied to this order';
COMMENT ON COLUMN orders.discount_cents IS 'The discount amount in cents applied to this order';
