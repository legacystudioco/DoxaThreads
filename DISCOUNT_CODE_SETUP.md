# Discount Code System Setup Guide

This guide will help you complete the setup of the discount code system for DoxaThreads.

## What Was Implemented

1. **Database Tables**
   - `discount_codes` - Stores all discount codes and their configurations
   - Added `discount_code` and `discount_cents` columns to `orders` table

2. **API Routes**
   - `/api/discount/validate` - Validates discount codes before application
   - Updated `/api/payments/create-intent` - Applies discounts to payment calculations

3. **UI Components**
   - Added discount code input field on checkout page
   - Shows applied discount in order summary
   - Displays discount amount in price breakdown

4. **Features**
   - 25% discount code: **HELLOFRIEND**
   - First-order-only validation
   - Usage tracking (counts how many times code is used)
   - Expiration date support
   - Max uses limit support
   - Percentage and fixed-amount discount types

## Database Migration Required

You need to run two SQL migrations in your Supabase Dashboard:

### Step 1: Go to Supabase Dashboard

1. Visit: https://app.supabase.com
2. Select your project: **njdmmnvdjoawckvoxcxd**
3. Navigate to **SQL Editor** from the left sidebar

### Step 2: Create Discount Codes Table

Copy and paste the contents of `migrations/create_discount_codes.sql` into the SQL Editor and click **Run**.

This will:
- Create the `discount_codes` table
- Insert the **HELLOFRIEND** code (25% off for first-time customers)
- Set up proper permissions and indexes

### Step 3: Add Discount Fields to Orders

Copy and paste the contents of `migrations/add_discount_to_orders.sql` into the SQL Editor and click **Run**.

This will:
- Add `discount_code` and `discount_cents` columns to the `orders` table
- Create a function to increment discount usage counts
- Set up proper indexes for reporting

## Testing the Discount Code

1. Start your development server: `npm run dev`
2. Add items to your cart
3. Go to checkout
4. Enter your email address
5. Complete the shipping address
6. Enter discount code: **HELLOFRIEND**
7. Click **Apply**
8. Verify that 25% is deducted from the subtotal
9. Complete the checkout to ensure payment processes correctly

## How the Discount Code Works

1. **User enters email** - Required to validate first-order status
2. **User enters discount code** - Automatically converted to uppercase
3. **System validates**:
   - Code exists and is active
   - Not expired
   - Hasn't reached max uses
   - For first-order codes: checks if customer has previous paid orders
4. **Discount applied**:
   - Percentage discounts apply to subtotal only
   - Fixed discounts are in cents
   - Tax is calculated on the discounted amount
   - Shipping is NOT discounted
5. **Payment processed** with discounted total
6. **Usage count incremented** after successful payment

## Managing Discount Codes

### View All Discount Codes

```sql
SELECT * FROM discount_codes ORDER BY created_at DESC;
```

### Create a New Discount Code

```sql
INSERT INTO discount_codes (code, discount_type, discount_value, first_order_only, active, max_uses, expires_at)
VALUES (
  'SUMMER25',           -- The code customers enter
  'percentage',         -- 'percentage' or 'fixed'
  25,                   -- 25% (or cents if fixed)
  false,                -- Not limited to first orders
  true,                 -- Active
  100,                  -- Max 100 uses (NULL = unlimited)
  '2025-08-31 23:59:59' -- Expires at end of August 2025
);
```

### Deactivate a Discount Code

```sql
UPDATE discount_codes
SET active = false
WHERE code = 'HELLOFRIEND';
```

### Check Discount Code Usage

```sql
SELECT
  dc.code,
  dc.discount_type,
  dc.discount_value,
  dc.used_count,
  dc.max_uses,
  COUNT(o.id) as orders_with_code,
  SUM(o.discount_cents) as total_discount_given_cents
FROM discount_codes dc
LEFT JOIN orders o ON o.discount_code = dc.code
WHERE dc.code = 'HELLOFRIEND'
GROUP BY dc.id, dc.code, dc.discount_type, dc.discount_value, dc.used_count, dc.max_uses;
```

## Discount Types

### Percentage Discount
```sql
-- 25% off subtotal
INSERT INTO discount_codes (code, discount_type, discount_value)
VALUES ('SAVE25', 'percentage', 25);
```

### Fixed Amount Discount
```sql
-- $10 off (1000 cents)
INSERT INTO discount_codes (code, discount_type, discount_value)
VALUES ('TEN_OFF', 'fixed', 1000);
```

## Security Features

- Case-insensitive code matching (HELLOFRIEND = hellofriend = HeLLoFrIeNd)
- First-order validation prevents repeat use by same customer
- Usage count prevents over-redemption
- Expiration dates ensure time-limited campaigns
- RLS policies ensure only active codes are readable by public

## Files Modified/Created

### New Files
- `migrations/create_discount_codes.sql` - Creates discount_codes table
- `migrations/add_discount_to_orders.sql` - Adds discount fields to orders
- `app/api/discount/validate/route.ts` - Discount validation endpoint
- `run-migrations.js` - Helper script (migration must be run manually)
- `DISCOUNT_CODE_SETUP.md` - This guide

### Modified Files
- `app/store/checkout/page.tsx` - Added discount UI and logic
- `app/api/payments/create-intent/route.ts` - Added discount calculation

## Support

If you encounter any issues:
1. Check browser console for errors
2. Check server logs for API errors
3. Verify migrations ran successfully in Supabase
4. Ensure HELLOFRIEND code exists in discount_codes table
5. Test with a fresh email address (for first-order validation)

---

**Ready to launch!** Once you run the migrations, your discount code system will be fully functional.
