import { Resend } from "resend";

/**
 * Centralized Resend client with strict env validation.
 * Keep this file server-only (do not import in client components).
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_ENABLED = Boolean(RESEND_API_KEY && EMAIL_FROM);

let resendClient: Resend | null = null;
function getResend() {
  if (!resendClient && RESEND_API_KEY) {
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}

const FROM = EMAIL_FROM;
let warnedEmailDisabled = false;
function warnEmailDisabled() {
  if (!warnedEmailDisabled) {
    console.warn(
      "Email sending is disabled: RESEND_API_KEY or EMAIL_FROM not configured."
    );
    warnedEmailDisabled = true;
  }
}

type CommonParams = {
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | string[];
  tags?: { name: string; value: string }[];
};

async function sendCore(to: string | string[], params: CommonParams) {
  if (!EMAIL_ENABLED) {
    warnEmailDisabled();
    return null;
  }

  const resend = getResend();
  const result = await resend!.emails.send({
    from: FROM as string,
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
