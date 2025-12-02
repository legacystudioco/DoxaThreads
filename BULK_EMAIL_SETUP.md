# Bulk Email Sender - Setup Guide

This guide covers the setup and usage of the Bulk Email Sender feature for your DoxaThreads dashboard.

## Overview

The Bulk Email Sender allows you to:
- Fetch all contacts from your Resend audience
- Compose rich HTML emails with a WYSIWYG editor
- Preview emails before sending
- Send test emails to verify appearance
- Send bulk emails to your entire audience (3,500+ contacts)

## Prerequisites

1. **Resend Account**: You need an active Resend account with API access
2. **Resend Audience**: Your contacts must be stored in a Resend Audience
3. **Environment Variables**: Required API keys and configuration

## Environment Variables Setup

Add the following variables to your `.env.local` file:

```bash
# Resend Configuration
RESEND_API_KEY=re_your_api_key_here
RESEND_AUDIENCE_ID=your_audience_id_here
EMAIL_FROM=noreply@yourdomain.com

# Optional: Test Email Address
ADMIN_EMAIL=your-email@gmail.com
```

### How to Get These Values:

1. **RESEND_API_KEY**:
   - Log in to [Resend Dashboard](https://resend.com/dashboard)
   - Navigate to API Keys section
   - Create a new API key or use existing one
   - Copy the key (starts with `re_`)

2. **RESEND_AUDIENCE_ID**:
   - Go to Audiences section in Resend Dashboard
   - Select your audience
   - Copy the Audience ID from the URL or settings
   - Format: UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)

3. **EMAIL_FROM**:
   - Use a verified domain email address
   - Format: `noreply@yourdomain.com` or `Name <email@domain.com>`
   - Must be a domain you've verified in Resend

## File Structure

The bulk email feature consists of the following files:

```
app/
├── studio/
│   ├── bulk-email/
│   │   └── page.tsx                    # Main UI page
│   └── dashboard/
│       └── page.tsx                    # Updated with navigation link
└── api/
    └── studio/
        └── bulk-email/
            ├── get-contacts/
            │   └── route.ts            # Fetch contacts from Resend
            ├── send-test/
            │   └── route.ts            # Send test email
            └── send-bulk/
                └── route.ts            # Send bulk emails
```

## Features

### 1. Contact Management
- Automatically fetches all contacts from your Resend audience
- Displays total contact count
- Shows preview of first 10 contacts with their details
- Refresh contact count on demand

### 2. Email Composition
- **Subject Line**: Simple text input for email subject
- **Rich Text Editor**: React Quill WYSIWYG editor with:
  - Headers (H1, H2, H3)
  - Text formatting (bold, italic, underline, strikethrough)
  - Lists (ordered and unordered)
  - Colors (text and background)
  - Links and images
  - Clean formatting option

### 3. Email Preview
- Live preview panel that updates as you type
- Shows exactly how the email will appear
- Responsive design (side-by-side on desktop, toggle on mobile)

### 4. Test Email Functionality
- Send a test email to any email address before bulk send
- Test email includes "[TEST]" prefix in subject
- Validates email format before sending
- Provides success/error feedback

### 5. Bulk Send
- Sends emails to all contacts in audience
- Batch processing (100 emails per batch)
- Rate limiting (1 second delay between batches)
- Confirmation dialog before sending
- Detailed results showing sent/failed counts

## API Endpoints

### GET `/api/studio/bulk-email/get-contacts`
Fetches all contacts from the Resend audience.

**Response:**
```json
{
  "success": true,
  "contacts": [...],
  "totalContacts": 3500
}
```

### POST `/api/studio/bulk-email/send-test`
Sends a test email to a specified address.

**Request Body:**
```json
{
  "testEmail": "test@example.com",
  "subject": "Email Subject",
  "htmlContent": "<p>Email content</p>"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "emailId": "email_id_from_resend"
}
```

### POST `/api/studio/bulk-email/send-bulk`
Sends email to entire audience.

**Request Body:**
```json
{
  "subject": "Email Subject",
  "htmlContent": "<p>Email content</p>"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk email campaign completed",
  "results": {
    "total": 3500,
    "sent": 3495,
    "failed": 5,
    "errors": []
  }
}
```

## Usage Instructions

### Accessing the Bulk Email Sender

1. Log in to your Studio Dashboard at `/studio/dashboard`
2. Click on the "Bulk Email" card in the navigation grid
3. You'll be redirected to `/studio/bulk-email`

### Composing an Email

1. **Enter Subject**: Type your email subject in the first input field
2. **Write Content**: Use the rich text editor to compose your email
   - Format text using the toolbar
   - Add links, images, and lists as needed
   - Use colors to highlight important information
3. **Preview**: Check the preview panel on the right to see how it looks

### Sending a Test Email

1. Enter your email address in the "Test Email Address" field
2. Ensure subject and content are filled in
3. Click "Send Test Email" button
4. Check your inbox for the test email with "[TEST]" prefix
5. Verify formatting and content

### Sending to Entire Audience

1. Ensure subject and content are finalized
2. Send a test email first to verify everything looks good
3. Click "Send to Entire Audience" button
4. Confirm the action in the dialog (shows total recipients)
5. Wait for the process to complete
6. Review the results (sent/failed counts)

## Best Practices

### Email Composition
- Keep subject lines under 50 characters for better open rates
- Use clear, concise language
- Include a clear call-to-action
- Test on multiple devices (desktop, mobile)
- Always send a test email first

### Sending Bulk Emails
- Send during business hours in your audience's timezone
- Avoid sending too frequently (recommend 1-2 times per week max)
- Monitor Resend dashboard for delivery rates
- Check spam reports and unsubscribe requests

### Technical Considerations
- Batch size is set to 100 emails per batch
- Delay between batches is 1 second (respects rate limits)
- Maximum audience size supported: Unlimited (batched processing)
- Resend API rate limits apply (check Resend documentation)

## Troubleshooting

### "RESEND_API_KEY is not configured"
- Check that `RESEND_API_KEY` is set in `.env.local`
- Verify the key starts with `re_`
- Restart your Next.js dev server after adding the variable

### "RESEND_AUDIENCE_ID is not configured"
- Check that `RESEND_AUDIENCE_ID` is set in `.env.local`
- Verify the ID matches your audience in Resend dashboard
- Restart your Next.js dev server

### "Failed to fetch contacts from Resend"
- Verify your API key has the correct permissions
- Check that the audience ID is correct
- Ensure your audience has contacts
- Check Resend API status

### "Failed to send test email"
- Verify email format is correct
- Check that `EMAIL_FROM` is a verified domain
- Review Resend dashboard for error details
- Ensure your Resend account is in good standing

### Emails Not Delivering
- Check Resend dashboard for delivery status
- Verify sender domain is verified
- Check for spam reports
- Review email content for spam triggers
- Ensure recipients haven't unsubscribed

### Rate Limiting Issues
- Reduce `BATCH_SIZE` in `/app/api/studio/bulk-email/send-bulk/route.ts`
- Increase `BATCH_DELAY` between batches
- Check your Resend plan limits
- Consider upgrading Resend plan for higher limits

## Security Notes

- All API routes are server-side only (API keys never exposed to client)
- Authentication required (must be logged into Studio)
- Environment variables never sent to browser
- API keys stored securely in `.env.local` (not committed to git)

## Future Enhancements

Potential improvements for future versions:

1. **Campaign Management**:
   - Save draft emails
   - Schedule emails for later
   - Track campaign history

2. **Analytics**:
   - Open rates
   - Click-through rates
   - Unsubscribe tracking

3. **Segmentation**:
   - Filter contacts by criteria
   - Create segments
   - A/B testing

4. **Templates**:
   - Save email templates
   - Pre-built layouts
   - Template library

5. **Advanced Features**:
   - Personalization (first name, etc.)
   - Conditional content
   - Attachment support

## Support

If you encounter issues:
1. Check this documentation first
2. Review Resend dashboard for API errors
3. Check Next.js console for error messages
4. Review browser console for client-side errors

## Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [React Quill Documentation](https://github.com/zenoamaro/react-quill)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
