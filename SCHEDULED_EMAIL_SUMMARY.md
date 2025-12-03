# Scheduled Email Feature - Summary

## ✅ What Was Implemented

I've added a complete scheduled email system to your bulk email functionality. Here's what you can now do:

### Core Features:
1. **Schedule emails** for a specific date and time
2. **View all scheduled emails** in a dedicated table
3. **Cancel pending emails** before they're sent
4. **Automatic sending** via cron job at scheduled time
5. **Status tracking** (pending, sent, failed, cancelled)
6. **Personalization support** (same variables as bulk emails)

## 📁 Files Created

```
migrations/
  └── create_scheduled_emails.sql         # Database schema

app/api/studio/bulk-email/
  ├── schedule/route.ts                   # Schedule, list, cancel endpoints
  └── process-scheduled/route.ts          # Cron job to send emails

app/api/studio/bulk-email/types.ts        # Updated with new types

Documentation/
  ├── SCHEDULED_EMAIL_SETUP.md            # Detailed setup guide
  ├── QUICK_START_SCHEDULED_EMAILS.md     # Quick start guide
  └── SCHEDULED_EMAIL_SUMMARY.md          # This file
```

## 📝 Files Modified

- [app/studio/bulk-email/page.tsx](app/studio/bulk-email/page.tsx) - Added scheduling UI components

## 🎨 UI Changes

### New Section: "Schedule Email"
Located between test email input and action buttons:
- **Date picker** - Select future date
- **Time picker** - Select time (24-hour format)
- **Schedule button** - Blue, distinct from send button

### New Section: "Scheduled Emails" Table
Located below campaign results, before contact preview:
- **Subject** column
- **Scheduled For** column (formatted datetime)
- **Recipients** count
- **Status** badge (color-coded)
- **Actions** column (cancel button for pending)
- **Refresh** button in header

### Button Layout:
```
┌─────────────────────────────────────────┐
│ Send Test Email                         │  ← Gray (secondary)
├─────────────────────────────────────────┤
│ Schedule Email for [Date]               │  ← Blue (new!)
├─────────────────────────────────────────┤
│ Send Now to Entire Audience (X)         │  ← Accent (primary)
└─────────────────────────────────────────┘
```

## 🗄️ Database Schema

```sql
CREATE TABLE scheduled_emails (
  id                  UUID PRIMARY KEY,
  subject             TEXT NOT NULL,
  html_content        TEXT NOT NULL,
  scheduled_date      DATE NOT NULL,
  scheduled_time      TIME NOT NULL,
  scheduled_datetime  TIMESTAMPTZ NOT NULL,
  status              TEXT NOT NULL,      -- pending|sent|failed|cancelled
  created_at          TIMESTAMPTZ,
  sent_at             TIMESTAMPTZ,
  total_recipients    INTEGER,
  sent_count          INTEGER,
  failed_count        INTEGER,
  error_message       TEXT,
  created_by          TEXT
);
```

## 🔌 API Endpoints

### 1. Schedule Email
```http
POST /api/studio/bulk-email/schedule
Content-Type: application/json

{
  "subject": "Your subject",
  "htmlContent": "<p>Content with {{first_name}}</p>",
  "scheduledDate": "2025-12-15",
  "scheduledTime": "14:30"
}
```

### 2. List Scheduled Emails
```http
GET /api/studio/bulk-email/schedule
```

### 3. Cancel Scheduled Email
```http
DELETE /api/studio/bulk-email/schedule?id={emailId}
```

### 4. Process Scheduled Emails (Cron)
```http
POST /api/studio/bulk-email/process-scheduled
Authorization: Bearer {CRON_SECRET}
```

## 🔧 Setup Required

### 1. Database Migration
Run the SQL in [migrations/create_scheduled_emails.sql](migrations/create_scheduled_emails.sql) via Supabase dashboard.

### 2. Environment Variable
Add to `.env.local`:
```env
CRON_SECRET=your-random-secret-here
```

### 3. Cron Job Setup
**Option A - Vercel Cron:**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/studio/bulk-email/process-scheduled",
    "schedule": "*/5 * * * *"
  }]
}
```

**Option B - External Cron Service:**
Call the process-scheduled endpoint every 5-10 minutes with Authorization header.

## 🎯 User Flow

```
1. User composes email
   ↓
2. User selects date + time
   ↓
3. User clicks "Schedule Email"
   ↓
4. Email saved to database (status: pending)
   ↓
5. Email appears in "Scheduled Emails" table
   ↓
6. [Time passes...]
   ↓
7. Cron job runs (every 5 min)
   ↓
8. Checks for due emails (scheduled_datetime <= now)
   ↓
9. Sends emails in batches
   ↓
10. Updates status (sent/failed)
    ↓
11. User sees updated status in table
```

## 🎨 Status Colors

- **Pending** → Blue badge (`bg-blue-900/50 text-blue-300`)
- **Sent** → Green badge (`bg-green-900/50 text-green-300`)
- **Failed** → Red badge (`bg-red-900/50 text-red-300`)
- **Cancelled** → Gray badge (`bg-gray-700 text-gray-300`)

## ⚙️ How It Works

1. **Scheduling:** User selects date/time, email is saved to `scheduled_emails` table with `status='pending'`

2. **Storage:** Date and time are stored separately AND as a combined UTC timestamp

3. **Processing:** Cron job runs every 5 minutes:
   - Queries for emails where `status='pending'` AND `scheduled_datetime <= NOW()`
   - Fetches active contacts
   - Sends emails in batches (100 per batch, 1 second delay)
   - Updates status and counts

4. **Display:** UI fetches and displays all scheduled emails, refreshes on actions

## 🔒 Security Features

- ✅ RLS policies on `scheduled_emails` table
- ✅ Cron endpoint requires Bearer token authentication
- ✅ Date/time validation (must be in future)
- ✅ Only pending emails can be cancelled
- ✅ Only due emails are processed

## 📊 TypeScript Types

```typescript
interface ScheduledEmail {
  id: string;
  subject: string;
  html_content: string;
  scheduled_date: string;
  scheduled_time: string;
  scheduled_datetime: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  total_recipients: number;
  sent_count?: number;
  failed_count?: number;
  error_message?: string;
}

interface ScheduleEmailRequest {
  subject: string;
  htmlContent: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM (24-hour)
}
```

## 🧪 Testing Steps

1. Start dev server: `npm run dev`
2. Go to `/studio/bulk-email`
3. Compose an email
4. Schedule for 2 minutes in future
5. Wait for time to pass
6. Manually trigger cron:
   ```bash
   curl -X POST http://localhost:3000/api/studio/bulk-email/process-scheduled \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
7. Refresh page - status should be "sent"

## 📚 Documentation Files

- **[QUICK_START_SCHEDULED_EMAILS.md](QUICK_START_SCHEDULED_EMAILS.md)** - Quick setup guide with copy-paste instructions
- **[SCHEDULED_EMAIL_SETUP.md](SCHEDULED_EMAIL_SETUP.md)** - Detailed setup and troubleshooting guide
- **[SCHEDULED_EMAIL_SUMMARY.md](SCHEDULED_EMAIL_SUMMARY.md)** - This file (overview)

## ✅ Feature Complete

The scheduled email feature is fully implemented and ready to use. Just complete the 3 setup steps:

1. ✅ Run database migration
2. ✅ Add CRON_SECRET environment variable
3. ✅ Set up cron job (Vercel or external)

Then you're ready to schedule emails! 🚀
