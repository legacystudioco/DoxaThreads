import { Resend } from "resend";

/**
 * Centralized Resend client with strict env validation.
 * Keep this file server-only (do not import in client components).
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;

if (!RESEND_API_KEY) {
  throw new Error(
    "RESEND_API_KEY is missing. Set it in Vercel → Project Settings → Environment Variables."
  );
}

if (!EMAIL_FROM) {
  throw new Error(
    "EMAIL_FROM is missing. Set it to something like 'Your App <onboarding@resend.dev>' for dev, or 'Your App <hello@yourdomain.com>' after domain verification."
  );
}

let resendClient: Resend | null = null;
function getResend() {
  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}

const FROM = EMAIL_FROM;

type CommonParams = {
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | string[];
  tags?: { name: string; value: string }[];
};

async function sendCore(to: string | string[], params: CommonParams) {
  const resend = getResend();
  const result = await resend.emails.send({
    from: FROM,
    to: Array.isArray(to) ? to : [to],
    subject: params.subject,
    html: params.html,
    text: params.text,
    reply_to: params.replyTo,
    tags: params.tags
  });
  return result.data?.id ?? null;
}

/**
 * Sends to the site owner (defaults to EMAIL_FROM).
 */
export async function sendOwnerEmail({
  subject,
  html,
  text,
  replyTo,
  tags
}: CommonParams) {
  return await sendCore(process.env.EMAIL_FROM as string, {
    subject,
    html,
    text,
    replyTo,
    tags
  });
}

/**
 * Sends to a customer address.
 */
export async function sendCustomerEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  tags
}: { to: string } & CommonParams) {
  return await sendCore(to, { subject, html, text, replyTo, tags });
}

/**
 * Printer: order notification.
 */
export async function sendPrinterOrderEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  tags
}: { to: string } & CommonParams) {
  return await sendCore(to, { subject, html, text, replyTo, tags });
}

/**
 * Printer: settlement notification.
 */
export async function sendPrinterSettlementEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  tags
}: { to: string } & CommonParams) {
  return await sendCore(to, { subject, html, text, replyTo, tags });
}

/**
 * Admin: notification emails.
 */
export async function sendAdminEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  tags
}: { to: string } & CommonParams) {
  return await sendCore(to, { subject, html, text, replyTo, tags });
}
