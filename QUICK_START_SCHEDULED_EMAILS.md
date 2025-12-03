# Quick Start: Scheduled Email Feature

## What's Been Added

I've added a complete scheduled email feature to your bulk email system. You can now:

✅ Schedule emails for a specific date and time
✅ View all scheduled emails in a table
✅ Cancel pending scheduled emails
✅ Automatically send emails at scheduled time (with cron setup)

## Files Created/Modified

### New Files:
- `migrations/create_scheduled_emails.sql` - Database migration
- `app/api/studio/bulk-email/schedule/route.ts` - Schedule, list, and cancel emails API
- `app/api/studio/bulk-email/process-scheduled/route.ts` - Process and send scheduled emails (cron endpoint)
- `SCHEDULED_EMAIL_SETUP.md` - Detailed setup guide
- `QUICK_START_SCHEDULED_EMAILS.md` - This file

### Modified Files:
- `app/studio/bulk-email/page.tsx` - Added scheduling UI
- `app/api/studio/bulk-email/types.ts` - Added TypeScript types

## Setup (3 Steps)

### Step 1: Run Database Migration

1. Open your Supabase dashboard: https://supabase.com/dashboard/project/njdmmnvdjoawckvoxcxd/sql/new

2. Copy and paste this SQL:

```sql
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
```

3. Click **Run**

### Step 2: Add Environment Variable

Add this to your `.env.local` file:

```env
# Generate a secure random secret for cron job authentication
CRON_SECRET=your-secure-random-secret-here
```

To generate a secure secret, run:
```bash
openssl rand -hex 32
```

Or use any random string generator.

### Step 3: Set Up Cron Job (Choose One Option)

#### Option A: Vercel Cron (Easiest for Vercel deployments)

1. Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/studio/bulk-email/process-scheduled",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

2. Deploy to Vercel
3. Add `CRON_SECRET` to Vercel environment variables

#### Option B: Manual Testing (For Development)

Manually trigger scheduled emails:

```bash
curl -X POST http://localhost:3000/api/studio/bulk-email/process-scheduled \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## How to Use

### Scheduling an Email

1. Go to `/studio/bulk-email`
2. Compose your email (subject + content)
3. In the **"Schedule Email"** section:
   - Pick a **Date** (must be in the future)
   - Pick a **Time** (24-hour format, e.g., 14:30 for 2:30 PM)
4. Click **"Schedule Email for [Selected Date]"**
5. Your email appears in the **"Scheduled Emails"** table below

### Viewing Scheduled Emails

The **"Scheduled Emails"** table shows:
- Subject
- Scheduled date/time
- Number of recipients
- Status badge (pending/sent/failed/cancelled)
- Cancel button (for pending emails)

### Cancelling a Scheduled Email

1. Find the email in the **"Scheduled Emails"** table
2. Click **"Cancel"** button
3. Confirm

## Testing

1. Schedule an email for 2-3 minutes in the future
2. Wait for the time to pass
3. Manually trigger the cron endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/studio/bulk-email/process-scheduled \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
4. Refresh the page - status should change to "sent"

## UI Features

### New UI Components:

1. **Schedule Section** (between test email and action buttons):
   - Date picker (only future dates)
   - Time picker (24-hour format)
   - Blue "Schedule Email" button

2. **Scheduled Emails Table** (below campaign results):
   - Shows all scheduled emails
   - Color-coded status badges
   - Cancel button for pending emails
   - Refresh button

3. **Action Buttons**:
   - "Send Test Email" - Test with personalization
   - "Schedule Email for [Date]" - Schedule for later (BLUE)
   - "Send Now to Entire Audience" - Send immediately (ACCENT)

## API Endpoints

- **POST** `/api/studio/bulk-email/schedule` - Schedule email
- **GET** `/api/studio/bulk-email/schedule` - List scheduled emails
- **DELETE** `/api/studio/bulk-email/schedule?id={id}` - Cancel scheduled email
- **POST** `/api/studio/bulk-email/process-scheduled` - Process due emails (cron)

## Status Meanings

- **pending** 🔵 - Waiting to be sent
- **sent** 🟢 - Successfully sent to all recipients
- **failed** 🔴 - Failed to send
- **cancelled** ⚪ - Cancelled by user

## Troubleshooting

**Emails not sending automatically?**
- Make sure cron job is set up and running
- Verify `CRON_SECRET` is correct
- Check scheduled time is in the past
- Manually trigger the endpoint to test

**Can't schedule in the past?**
- This is by design - date picker only allows future dates
- API validates scheduled time is in the future

**Time zone issues?**
- All times are stored in UTC
- UI displays times in your browser's timezone
- Schedule in your local time, it converts automatically

## Next Steps

1. ✅ Run the database migration (Step 1)
2. ✅ Add `CRON_SECRET` to `.env.local` (Step 2)
3. ✅ Set up cron job (Step 3)
4. 🧪 Test scheduling an email
5. 🚀 Deploy and use in production

## Need Help?

See the detailed guide: `SCHEDULED_EMAIL_SETUP.md`

## Summary

You now have a fully functional scheduled email system! Users can compose emails, schedule them for any future date/time, and the system will automatically send them when the time comes.
