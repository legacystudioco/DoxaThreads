# Database Schema & Order Status Fix

## Issues Found

### Issue 1: Orders Not Automatically Marked as "PAID"
Your Stripe webhook sets the order to "PAID" initially, but then immediately changes it to "LABEL_PURCHASED" after buying the shipping label. This is actually correct behavior - it just happens so fast you don't see the "PAID" status.

**Current Flow:**
1. Payment succeeds → Order marked as "PAID" ✅
2. Shipping label purchased → Order immediately updated to "LABEL_PURCHASED" ✅

**This is working as designed!** The order goes through PAID but quickly moves to LABEL_PURCHASED.

### Issue 2: Missing `updated_at` Column in Database
The `orders` table in your Supabase database is missing the `updated_at` column, causing 500 errors when trying to update order status.

**Error:** "Failed to load resource: the server responded with a status of 500"  
**Cause:** API routes were trying to update `updated_at` column which doesn't exist

## Solutions Applied

### Solution 1: Updated All API Routes
✅ Removed `updated_at` from all order update queries
✅ Updated `/app/api/admin/orders/update-status/route.ts`
✅ Updated `/app/api/admin/orders/update-tracking/route.ts`
✅ Updated `/app/api/orders/update-status/route.ts`
✅ Updated `/app/api/orders/update-tracking/route.ts`
✅ Made `updated_at` optional in frontend TypeScript interface

### Solution 2: Database Migration (IMPORTANT - RUN THIS!)

**You MUST run this SQL in your Supabase SQL Editor:**

```sql
-- Add updated_at column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create an update trigger to automatically update the timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists (to avoid errors)
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;

-- Create trigger
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Backfill existing orders with created_at value
UPDATE public.orders 
SET updated_at = created_at 
WHERE updated_at IS NULL;
```

**Where to run this:**
1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Paste the SQL above
4. Click "Run"

This will:
- Add the `updated_at` column to all orders
- Create an automatic trigger to update it whenever an order changes
- Set existing orders' `updated_at` to their `created_at` date

## Order Status Flow (Automated)

Here's what happens automatically when a customer places an order:

1. **Customer completes checkout** → Payment Intent created
2. **Payment succeeds** → Stripe webhook triggered
3. **Webhook processes order:**
   - ✅ Order status set to "PAID"
   - ✅ Costs snapshotted to order items
   - ✅ Shipping label purchased from Shippo
   - ✅ Order status updated to "LABEL_PURCHASED"
   - ✅ Tracking number saved
   - ✅ Customer receives confirmation email
   - ✅ Printer receives order email with label
   - ✅ Admin receives notification

**So orders DO get marked as PAID - it just happens in milliseconds before moving to LABEL_PURCHASED!**

## Manual Status Updates (Admin Dashboard)

After running the database migration, you'll be able to manually update orders through the admin dashboard:

✅ **PAID** - Mark order as paid (usually automatic)
✅ **LABEL_PURCHASED** - Mark label as purchased (usually automatic)
✅ **RECEIVED_BY_PRINTER** - Printer has received the order
✅ **SHIPPED** - Order has shipped (sends customer email with tracking)
✅ **DELIVERED** - Order delivered (sends customer confirmation)
✅ **CANCELLED** - Cancel order (sends customer notification)

## Testing Checklist

After running the database migration:

- [ ] Run the SQL migration in Supabase SQL Editor
- [ ] Restart your Next.js dev server (`npm run dev` or redeploy to Vercel)
- [ ] Go to admin dashboard → Orders
- [ ] Click "View Details" on any order (should load successfully)
- [ ] Try updating order status (should work without 500 errors)
- [ ] Try adding/updating tracking information
- [ ] Verify email notifications are sent when marking as SHIPPED
- [ ] Test with a new test order to see full automated flow

## Files Modified

### API Routes (Removed updated_at dependency)
- ✅ `/app/api/admin/orders/[id]/route.ts` (created)
- ✅ `/app/api/admin/orders/update-status/route.ts` (created & fixed)
- ✅ `/app/api/admin/orders/update-tracking/route.ts` (created & fixed)
- ✅ `/app/api/orders/update-status/route.ts` (fixed)
- ✅ `/app/api/orders/update-tracking/route.ts` (fixed)

### Frontend
- ✅ `/app/studio/orders/[id]/page.tsx` (made updated_at optional)

### Database Migration
- 📄 `/DATABASE_MIGRATION_ADD_UPDATED_AT.sql` (RUN THIS!)

## Next Steps

1. **CRITICAL:** Run the SQL migration in Supabase
2. Restart your application (or redeploy)
3. Test the admin dashboard order details
4. Place a test order to verify the full flow
5. Monitor for any errors in the console

## Understanding Order Statuses

**Automated Statuses (Set by System):**
- `PENDING` → Order created, awaiting payment
- `PAID` → Payment received (happens for ~1 second during webhook)
- `LABEL_PURCHASED` → Shipping label created (immediately after PAID)

**Manual Statuses (Set by Admin/Printer):**
- `RECEIVED_BY_PRINTER` → Printer has the order
- `SHIPPED` → Order shipped to customer
- `DELIVERED` → Order delivered
- `CANCELLED` → Order cancelled

The status flow you'll typically see:
```
PENDING → PAID → LABEL_PURCHASED → RECEIVED_BY_PRINTER → SHIPPED → DELIVERED
```

Since the webhook handles PAID → LABEL_PURCHASED automatically and instantly, you'll rarely see orders in the "PAID" status unless there's an issue purchasing the label.

## Troubleshooting

**If orders still show as PENDING:**
- Check Stripe webhook logs to see if webhook is being called
- Verify `STRIPE_WEBHOOK_SECRET` environment variable is set
- Check Vercel/deployment logs for webhook errors

**If you still get 500 errors:**
- Confirm you ran the SQL migration
- Check browser console for specific error messages
- Verify Supabase connection is working
- Check RLS policies on the orders table

Your admin dashboard should now work perfectly! 🎉
