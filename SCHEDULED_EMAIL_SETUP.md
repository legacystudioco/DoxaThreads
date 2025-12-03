# Scheduled Email Feature Setup Guide

This guide explains how to set up and use the scheduled email feature for your bulk email campaigns.

## Overview

The scheduled email feature allows you to:
- Schedule bulk emails for a specific date and time
- View all scheduled emails and their status
- Cancel pending scheduled emails
- Automatically send emails at the scheduled time using a cron job

## Database Setup

### 1. Run the Migration

First, you need to create the `scheduled_emails` table in your Supabase database.

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `migrations/create_scheduled_emails.sql`
4. Paste and run the SQL in the editor

**Option B: Using the Migration Script**

```bash
node run-scheduled-email-migration.js
```

### 2. Verify the Table

After running the migration, verify the table exists:

```sql
SELECT * FROM scheduled_emails LIMIT 1;
```

## Environment Variables

Add the following to your `.env.local` file:

```env
# Cron Job Security (generate a random secret)
CRON_SECRET=your-secure-random-secret-here
```

To generate a secure secret, you can use:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Cron Job Setup

The scheduled emails need a cron job to process and send them at the scheduled time.

### Vercel Cron (Recommended for Vercel deployments)

1. Create a `vercel.json` file in your project root (or add to existing):

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

This will check for scheduled emails every 5 minutes.

2. Deploy to Vercel:

```bash
vercel deploy
```

3. In your Vercel project settings, add the `CRON_SECRET` environment variable.

### Alternative: External Cron Service

If not using Vercel, you can use any cron service (e.g., cron-job.org, EasyCron):

1. Set up a cron job to make POST requests to:
   ```
   https://your-domain.com/api/studio/bulk-email/process-scheduled
   ```

2. Add the authorization header:
   ```
   Authorization: Bearer YOUR_CRON_SECRET
   ```

3. Schedule it to run every 5-10 minutes.

### Local Development

For local testing, you can manually trigger the processing:

```bash
curl -X POST http://localhost:3000/api/studio/bulk-email/process-scheduled \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Usage

### Scheduling an Email

1. Navigate to `/studio/bulk-email`
2. Compose your email (subject and content)
3. In the "Schedule Email" section:
   - Select a date (must be in the future)
   - Select a time (24-hour format)
4. Click "Schedule Email for [Selected Date]"
5. Confirm the scheduling

### Viewing Scheduled Emails

Scheduled emails appear in the "Scheduled Emails" table at the bottom of the page, showing:
- Subject
- Scheduled date and time
- Number of recipients
- Status (pending, sent, failed, cancelled)
- Actions (cancel if pending)

### Cancelling a Scheduled Email

1. Find the scheduled email in the list
2. Click "Cancel" in the Actions column
3. Confirm the cancellation

The email will be marked as "cancelled" and won't be sent.

## API Endpoints

### POST `/api/studio/bulk-email/schedule`

Schedule a new bulk email.

**Request Body:**
```json
{
  "subject": "Email Subject",
  "htmlContent": "<p>Email content with {{first_name}} variables</p>",
  "scheduledDate": "2025-12-15",
  "scheduledTime": "14:30"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email scheduled for 2025-12-15 at 14:30",
  "scheduledEmail": { ... }
}
```

### GET `/api/studio/bulk-email/schedule`

Fetch all scheduled emails.

**Response:**
```json
{
  "success": true,
  "scheduledEmails": [
    {
      "id": "uuid",
      "subject": "Subject",
      "scheduled_datetime": "2025-12-15T14:30:00Z",
      "status": "pending",
      "total_recipients": 150
    }
  ]
}
```

### DELETE `/api/studio/bulk-email/schedule?id={emailId}`

Cancel a scheduled email.

**Response:**
```json
{
  "success": true,
  "message": "Email cancelled successfully"
}
```

### POST `/api/studio/bulk-email/process-scheduled`

Process and send all due scheduled emails (called by cron).

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 2 scheduled email(s)",
  "processed": 2,
  "results": [ ... ]
}
```

## Database Schema

```sql
CREATE TABLE scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  scheduled_datetime TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_by TEXT
);
```

**Status Values:**
- `pending`: Email is scheduled and waiting to be sent
- `sent`: Email was successfully sent to all recipients
- `failed`: Email sending failed
- `cancelled`: Email was cancelled by user

## Troubleshooting

### Emails Not Being Sent

1. Check that the cron job is running:
   - Vercel: Check "Cron Jobs" tab in your project
   - External: Check your cron service logs

2. Verify the `CRON_SECRET` is set correctly in your environment variables

3. Manually trigger the processing endpoint to test:
   ```bash
   curl -X POST https://your-domain.com/api/studio/bulk-email/process-scheduled \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

4. Check your server logs for errors

### Time Zone Issues

- All scheduled times are stored in UTC
- Make sure you're scheduling in your local timezone, and it will be converted to UTC automatically
- The UI displays times in the browser's local timezone

### Email Personalization

The scheduled emails support the same personalization variables as regular bulk emails:
- `{{first_name}}`: Recipient's first name
- `{{last_name}}`: Recipient's last name
- `{{email}}`: Recipient's email address

## Security Notes

- The `CRON_SECRET` should be a strong, random string
- Keep the secret secure and don't commit it to version control
- Only scheduled emails with `status='pending'` and `scheduled_datetime <= NOW()` are processed
- Row Level Security (RLS) policies are enabled on the `scheduled_emails` table

## Testing

To test the scheduled email feature locally:

1. Schedule an email for a few minutes in the future
2. Wait for the scheduled time to pass
3. Manually trigger the processing endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/studio/bulk-email/process-scheduled \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
4. Check the scheduled emails list to see the status updated to "sent"

## Support

If you encounter issues, check:
1. Server logs for detailed error messages
2. Supabase dashboard for database errors
3. Network tab in browser DevTools for API response errors
