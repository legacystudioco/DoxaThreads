# Unsubscribe Feature Documentation

## Overview
A complete unsubscribe system has been implemented for your bulk email campaigns. Users can unsubscribe with one click, and they'll be permanently marked as unsubscribed in Resend's system.

## How It Works

### 1. Automatic Unsubscribe Links
Every bulk email now automatically includes an unsubscribe link at the bottom with:
- Personalized message: "You're receiving this email because you signed up for updates from Doxa Threads"
- One-click unsubscribe link

### 2. Secure Token System
- Each unsubscribe link contains a cryptographically signed token
- Token includes: recipient email + contact ID + HMAC signature
- Prevents unauthorized unsubscribes (users can't unsubscribe others)

### 3. Resend Integration
When a user clicks unsubscribe:
1. Token is verified for authenticity
2. Contact is marked as `unsubscribed: true` in Resend's Audience API
3. User is redirected to a confirmation page
4. **They will NEVER receive emails again** - your bulk sender filters out unsubscribed contacts

## Files Created/Modified

### New Files:
- `app/api/unsubscribe/route.ts` - API endpoint that processes unsubscribe requests
- `app/unsubscribe/page.tsx` - User-facing unsubscribe confirmation page

### Modified Files:
- `app/api/studio/bulk-email/utils.ts` - Added unsubscribe token generation & footer functions
- `app/api/studio/bulk-email/send-bulk/route.ts` - Adds unsubscribe links to all emails
- `app/api/studio/bulk-email/send-test/route.ts` - Includes unsubscribe link in test emails
- `app/api/studio/bulk-email/process-scheduled/route.ts` - Adds unsubscribe links to scheduled emails
- `.env.example` - Documented new UNSUBSCRIBE_SECRET variable
- `.env.local` - Added secure UNSUBSCRIBE_SECRET value

## Environment Variables

### Required
```bash
UNSUBSCRIBE_SECRET=jCCExzF6whnx7bkJaL/EKcgB12LlW+z5drFNM3bAPsU=
```
This has been added to your `.env.local` file. **Keep this secret secure!**

## Testing the Feature

### 1. Send a Test Email
1. Go to your bulk email dashboard: `/studio/bulk-email`
2. Compose an email
3. Enter your test email address
4. Click "Send Test Email"
5. Check your inbox - you'll see an unsubscribe link at the bottom

### 2. Test Unsubscribe Flow
1. Click the unsubscribe link in the test email
2. You'll be redirected to `/unsubscribe?success=true`
3. You'll see a confirmation message
4. That email is now marked as unsubscribed in Resend

### 3. Verify Unsubscribe Works
1. Try sending another bulk email
2. The unsubscribed contact will be automatically excluded
3. Check console logs - you'll see: "Found X active contacts (Y unsubscribed)"

## API Endpoints

### GET /api/unsubscribe?token=xxx
- One-click unsubscribe (used in email links)
- Verifies token, marks contact as unsubscribed
- Redirects to confirmation page

### POST /api/unsubscribe
- JSON API for unsubscribe
- Body: `{ "token": "xxx" }`
- Returns: `{ "success": true, "email": "user@example.com" }`

## Security Features

1. **HMAC Signatures** - Prevents token tampering
2. **Base64URL Encoding** - URL-safe tokens
3. **Contact ID Validation** - Ensures unsubscribe targets correct contact
4. **Server-Side Verification** - All checks happen server-side

## User Experience

### Success Flow:
1. User receives email with unsubscribe link
2. Clicks link → Redirected to success page
3. Sees: "You're Unsubscribed" with green checkmark
4. Email address shown for confirmation
5. Option to return home or resubscribe

### Error Flow:
- Invalid/expired token → Error page with support contact
- Missing token → Error page
- Server error → Error page with retry option

## Important Notes

### Unsubscribed Users Are Excluded
Your bulk email sender at [send-bulk/route.ts](app/api/studio/bulk-email/send-bulk/route.ts#L104) filters out unsubscribed contacts:

```typescript
const activeContacts = allContacts.filter(contact => !contact.unsubscribed);
```

This means:
- ✅ Unsubscribed users will NEVER receive future emails
- ✅ They can't be re-added unless they manually re-subscribe
- ✅ Complies with email marketing laws (CAN-SPAM, GDPR)

### Production Deployment
When deploying to production, make sure:
1. `UNSUBSCRIBE_SECRET` is set in your production environment
2. The domain in unsubscribe links matches your production domain (currently: `https://doxa-threads.com`)
3. Test the full flow in production before sending real campaigns

## Compliance
This implementation helps you comply with:
- **CAN-SPAM Act** (US) - Requires unsubscribe mechanism
- **GDPR** (EU) - Right to withdraw consent
- **CASL** (Canada) - Unsubscribe requirements

## Support
If users have trouble unsubscribing:
- They can contact: info@doxa-threads.com
- You can manually unsubscribe them via Resend dashboard
- Unsubscribe tokens don't expire (unless you change UNSUBSCRIBE_SECRET)
