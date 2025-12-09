# ✅ DEPLOYMENT CHECKLIST

## Pre-Deploy Checks

- [x] Service role key exists in `.env.local` ✅
- [ ] Service role key added to Vercel environment variables
- [ ] New API route created: `app/api/track-visitor/route.ts` ✅
- [ ] New component created: `components/VisitorTracker-ServerSide.tsx` ✅

---

## Deploy Steps

### 1. Replace the Component
```bash
cp components/VisitorTracker-ServerSide.tsx components/VisitorTracker.tsx
```

### 2. Commit Changes
```bash
git add .
git commit -m "fix: implement server-side visitor tracking to bypass RLS"
git push
```

### 3. Add Environment Variable to Vercel
1. Go to: https://vercel.com/tyler-macpro/doxa-threads/settings/environment-variables
2. Click "Add New"
3. **Key:** `SUPABASE_SERVICE_ROLE_KEY`
4. **Value:** (copy from `.env.local` - starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
5. **Environment:** Select Production, Preview, and Development
6. Click "Save"

### 4. Redeploy (if needed)
If Vercel didn't auto-deploy, trigger a redeploy:
```bash
git commit --allow-empty -m "trigger redeploy"
git push
```

---

## Testing

### After Deploy:
- [ ] Visit https://www.doxa-threads.com in incognito mode
- [ ] Open browser console (F12)
- [ ] Navigate to a few pages (home, store, about)
- [ ] Look for: `✅ Successfully tracked visit` in console
- [ ] Check Vercel logs for errors

### Verify in Supabase:
1. Go to: https://supabase.com/dashboard/project/njdmmnvdjoawckvoxcxd/editor
2. Run this query:
```sql
SELECT 
    id,
    session_id,
    page_path,
    city,
    region,
    country,
    created_at
FROM visitor_events
ORDER BY created_at DESC
LIMIT 20;
```
3. Should see new visitor events!

---

## Success Indicators

✅ **No errors in Vercel logs** (no more RLS errors)
✅ **Console shows:** `[VisitorTracker] ✅ Successfully tracked visit`
✅ **New rows in** `visitor_events` table
✅ **Location data is captured** (city, region, country)

---

## Troubleshooting

### Still Getting 401 Errors?
- Check that `SUPABASE_SERVICE_ROLE_KEY` is in Vercel
- Make sure you selected all environments (Production, Preview, Development)
- Trigger a redeploy after adding the env var

### API Route Not Found?
- Make sure `app/api/track-visitor/route.ts` exists
- Check it was included in the git commit
- Verify the build succeeded in Vercel

### Location Data Not Showing?
- This is normal for local development (127.0.0.1)
- Test in production for real IP addresses

### Still Getting RLS Errors?
- Means the old component is still being used
- Double-check you copied `VisitorTracker-ServerSide.tsx` to `VisitorTracker.tsx`
- Clear your browser cache and hard refresh (Cmd+Shift+R)

---

## Files Changed

```
app/api/track-visitor/route.ts         [NEW - API endpoint]
components/VisitorTracker.tsx          [MODIFIED - now uses API]
components/VisitorTracker-ServerSide.tsx [NEW - template]
SOLUTION_SUMMARY.md                    [NEW - this guide]
VISITOR_TRACKING_FIX_README.md        [NEW - detailed docs]
VISITOR_TRACKING_FINAL_FIX.sql        [NEW - alternative RLS fix]
```

---

## Next Steps After This Works

Once visitor tracking is working, you can:

1. **Create Analytics Dashboard** at `/admin/analytics`
2. **View top pages:**
   ```sql
   SELECT page_path, COUNT(*) as visits
   FROM visitor_events
   GROUP BY page_path
   ORDER BY visits DESC;
   ```
3. **Track unique visitors:**
   ```sql
   SELECT COUNT(DISTINCT session_id) as unique_visitors
   FROM visitor_events;
   ```
4. **Geographic breakdown:**
   ```sql
   SELECT country, city, COUNT(*) as visits
   FROM visitor_events
   WHERE country IS NOT NULL
   GROUP BY country, city
   ORDER BY visits DESC;
   ```

---

## Quick Reference

**Vercel Dashboard:** https://vercel.com/tyler-macpro/doxa-threads
**Supabase Dashboard:** https://supabase.com/dashboard/project/njdmmnvdjoawckvoxcxd
**Your Site:** https://www.doxa-threads.com

---

## Support

If you're still having issues:
1. Check the browser console for detailed errors
2. Check Vercel function logs
3. Verify the environment variable is set correctly
4. Try a hard refresh (Cmd+Shift+R)
5. Test in incognito mode

Let me know if you need help! 🚀
