-- Insert the DOXA-WELCOME discount code
INSERT INTO discount_codes (code, discount_type, discount_value, first_order_only, active)
VALUES ('DOXA-WELCOME', 'percentage', 20, true, true)
ON CONFLICT (code) DO UPDATE SET
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  first_order_only = EXCLUDED.first_order_only,
  active = EXCLUDED.active,
  updated_at = NOW();

COMMENT ON TABLE discount_codes IS 'DOXA-WELCOME is a 20% off code for first-time customers who sign up for the newsletter';
