import { createServiceClient } from "../db";

/**
 * Server-side Supabase client using the service role key.
 * Useful for API routes/cron jobs that need elevated privileges without relying on cookies.
 */
export function createClient() {
  return createServiceClient();
}
