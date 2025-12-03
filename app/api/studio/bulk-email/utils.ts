// Utility functions for Bulk Email feature

import { Contact } from "./types";
import crypto from "crypto";

const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || "your-secret-key-change-this";

/**
 * Personalizes email content by replacing template variables with contact data
 * Supports: {{first_name}}, {{last_name}}, {{email}}
 */
export function personalizeEmail(
  template: string,
  contact: Contact
): string {
  let personalized = template;

  // Replace {{first_name}}
  personalized = personalized.replace(
    /\{\{first_name\}\}/gi,
    contact.first_name || ""
  );

  // Replace {{last_name}}
  personalized = personalized.replace(
    /\{\{last_name\}\}/gi,
    contact.last_name || ""
  );

  // Replace {{email}}
  personalized = personalized.replace(
    /\{\{email\}\}/gi,
    contact.email || ""
  );

  return personalized;
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Splits array into batches of specified size
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Delays execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculates progress percentage
 */
export function calculateProgress(
  current: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}

/**
 * Generates a secure unsubscribe token for a contact
 */
export function generateUnsubscribeToken(email: string, contactId: string): string {
  const data = `${email}:${contactId}`;
  const hmac = crypto.createHmac("sha256", UNSUBSCRIBE_SECRET);
  hmac.update(data);
  const signature = hmac.digest("hex");

  // Encode email and contactId with signature
  const payload = Buffer.from(JSON.stringify({ email, contactId, signature })).toString("base64url");
  return payload;
}

/**
 * Generates an unsubscribe link for a contact
 */
export function generateUnsubscribeLink(email: string, contactId: string, baseUrl: string = "https://doxa-threads.com"): string {
  const token = generateUnsubscribeToken(email, contactId);
  return `${baseUrl}/api/unsubscribe?token=${token}`;
}

/**
 * Adds an unsubscribe footer to HTML email content
 */
export function addUnsubscribeFooter(htmlContent: string, email: string, contactId: string): string {
  const unsubscribeLink = generateUnsubscribeLink(email, contactId);

  const footer = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
      <p style="margin: 0 0 10px 0;">You're receiving this email because you signed up for updates from Doxa Threads.</p>
      <p style="margin: 0;">
        <a href="${unsubscribeLink}" style="color: #666; text-decoration: underline;">Unsubscribe</a> from these emails
      </p>
    </div>
  `;

  return htmlContent + footer;
}
