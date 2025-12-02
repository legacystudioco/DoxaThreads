// Utility functions for Bulk Email feature

import { Contact } from "./types";

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
