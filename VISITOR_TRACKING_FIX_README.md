# 🔧 Visitor Tracking RLS Error - FIXED

## The Problem
You're getting this error:
```
new row violates row-level security policy for table "visitor_events"
Anonymous users cannot insert into visitor_events
```

This happens because your Supabase RLS policies are blocking anonymous (non-authenticated) users from inserting visitor tracking data.

---

## ✅ Solution 1: Fix RLS Policies (Recommended if you want client-side tracking)

### Step 1: Run the SQL Migration
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the **entire contents** of `VISITOR_TRACKING_FINAL_FIX.sql`
5. Click "Run"

The migration will:
- Drop all existing RLS policies
- Grant INSERT permission to anonymous users
- Create new policies that allow anonymous inserts

### Step 2: Verify the Fix
After running the SQL, you should see output like:
```
=== TABLE PERMISSIONS ===
anon          | INSERT
authenticated | INSERT
authenticated | SELECT
service_role  | ALL

=== RLS POLICIES ===
visitor_events_anon_insert    | {anon}          | INSERT
visitor_events_auth_insert    | {authenticated} | INSERT
visitor_events_auth_select    | {authenticated} | SELECT
visitor_events_service_all    | {service_role}  | ALL
```

### Step 3: Test
1. Deploy to Vercel: `git add . && git commit -m "fix: update visitor tracking" && git push`
2. Visit your website in incognito mode
3. Check the browser console - you should see: `✅ Successfully tracked visit`
4. Check your Vercel logs - the RLS errors should be gone

---

## ✅ Solution 2: Server-Side API Route (Recommended - More Reliable!)

This solution bypasses RLS entirely by using the service role key on the server.

### Step 1: Use the New API Route
I've created `/app/api/track-visitor/route.ts` which uses your service role key to insert tracking data (bypassing RLS).

### Step 2: Update Your VisitorTracker Component
Replace your current `components/VisitorTracker.tsx` with `components/VisitorTracker-ServerSide.tsx`:

```bash
# Backup the old one
mv components/VisitorTracker.tsx components/VisitorTracker-OLD.tsx

# Use the new server-side version
mv components/VisitorTracker-ServerSide.tsx components/VisitorTracker.tsx
```

### Step 3: Make Sure You Have SUPABASE_SERVICE_ROLE_KEY
Check your `.env.local` and Vercel environment variables:

```bash
# Should be in your .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # ← Make sure this exists!
```

To add to Vercel:
1. Go to: https://vercel.com/your-account/doxa-threads/settings/environment-variables
2. Add `SUPABASE_SERVICE_ROLE_KEY` with your service role key from Supabase
3. Redeploy

### Step 4: Deploy and Test
```bash
git add .
git commit -m "fix: use server-side visitor tracking API"
git push
```

---

## 🎯 Which Solution Should You Use?

### Use Solution 1 (Fix RLS) if:
- You want to keep visitor tracking entirely client-side
- You trust your RLS policies to protect your data
- You want minimal server load

### Use Solution 2 (API Route) if:
- You want more reliable tracking
- You want better control over what data gets saved
- You don't mind the extra API call
- You want to bypass RLS complexity

**My Recommendation: Use Solution 2** - It's more reliable, easier to debug, and you don't have to worry about RLS policy configurations.

---

## 🧪 Testing

After deploying either solution:

1. **Open browser console** (F12)
2. **Visit your homepage** in incognito mode
3. **Look for:** `[VisitorTracker] ✅ Successfully tracked visit`
4. **Check Vercel logs** - should see no more RLS errors

5. **Verify in Supabase:**
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/editor
   - Run: `SELECT * FROM visitor_events ORDER BY created_at DESC LIMIT 10;`
   - You should see new visitor events!

---

## 📊 Next Steps

Once tracking is working, you can:

1. **Create an analytics dashboard** in `/admin/analytics`
2. **View top pages:** `SELECT page_path, COUNT(*) FROM visitor_events GROUP BY page_path ORDER BY COUNT(*) DESC;`
3. **View unique visitors:** `SELECT COUNT(DISTINCT session_id) FROM visitor_events;`
4. **View geographic data:** `SELECT country, city, COUNT(*) FROM visitor_events GROUP BY country, city ORDER BY COUNT(*) DESC;`

---

## 🐛 Still Having Issues?

If you still get errors:

1. **Check your service role key is set** in Vercel environment variables
2. **Clear your browser cache** and try in incognito mode
3. **Check Vercel function logs** for detailed error messages
4. **Verify your Supabase table exists:** Go to Table Editor → visitor_events

Let me know if you need any help!
