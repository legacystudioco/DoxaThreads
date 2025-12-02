# Bulk Email Sender - Quick Start Guide

## ⚡ 3-Minute Setup

### Step 1: Add Environment Variables
Add these three lines to your `.env.local` file:

```bash
RESEND_API_KEY=re_your_key_here
RESEND_AUDIENCE_ID=your_audience_id_here
EMAIL_FROM=noreply@yourdomain.com
```

### Step 2: Restart Server
```bash
npm run dev
```

### Step 3: Access the Feature
1. Go to `/studio/dashboard`
2. Click the "Bulk Email" card
3. Start sending emails!

---

## 🎯 Where to Find Your Keys

### Resend API Key
1. Go to: https://resend.com/dashboard
2. Click "API Keys" in sidebar
3. Copy your key (starts with `re_`)

### Resend Audience ID
1. Go to: https://resend.com/audiences
2. Click on your audience
3. Copy the ID from the URL or settings page

### Email From
- Use a verified domain email
- Format: `noreply@yourdomain.com`
- Verify domain at: https://resend.com/domains

---

## 📧 How to Send Your First Email

1. **Compose**:
   - Enter subject line
   - Type email content using the editor
   - Format text with toolbar (bold, links, etc.)

2. **Test**:
   - Enter your email in "Test Email Address"
   - Click "Send Test Email"
   - Check your inbox

3. **Send**:
   - Review preview panel
   - Click "Send to Entire Audience"
   - Confirm the dialog
   - Wait for completion

---

## 📁 What Was Created

### New Pages
- `/app/studio/bulk-email/page.tsx` - Main page

### New API Routes
- `/app/api/studio/bulk-email/get-contacts/route.ts`
- `/app/api/studio/bulk-email/send-test/route.ts`
- `/app/api/studio/bulk-email/send-bulk/route.ts`

### Updated Files
- `/app/studio/dashboard/page.tsx` - Added navigation link

---

## ✨ Features

✅ Pull all contacts from Resend Audience (~3,500 contacts)
✅ Rich text WYSIWYG editor (React Quill)
✅ Live email preview
✅ Send test email before bulk send
✅ Send to entire audience with one click
✅ Shows contact count
✅ Batch processing (100 per batch)
✅ Rate limiting (respects Resend limits)
✅ Mobile responsive
✅ Authentication required

---

## 🚨 Troubleshooting

**"RESEND_API_KEY is not configured"**
→ Check `.env.local` has `RESEND_API_KEY=re_xxx`
→ Restart dev server

**"Failed to fetch contacts"**
→ Verify API key permissions
→ Check audience ID is correct
→ Ensure audience has contacts

**"Failed to send email"**
→ Verify `EMAIL_FROM` is a verified domain
→ Check Resend dashboard for errors
→ Ensure account is active

---

## 📚 Full Documentation

For detailed information, see:
- **[BULK_EMAIL_SETUP.md](BULK_EMAIL_SETUP.md)** - Complete setup guide
- **[BULK_EMAIL_SUMMARY.md](BULK_EMAIL_SUMMARY.md)** - Implementation details

---

## 🎉 You're Ready!

That's it! Your bulk email sender is fully functional and ready to use.

Ready for the next part when you are! 🚀
