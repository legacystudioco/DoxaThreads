import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  SendBulkEmailRequest,
  SendBulkEmailResponse,
  Contact,
  BatchResult,
} from "../types";
import { personalizeEmail, batchArray, delay, addUnsubscribeFooter } from "../utils";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
const EMAIL_FROM = process.env.EMAIL_FROM || "Doxa Threads <info@doxa-threads.com>";
const REPLY_TO = process.env.REPLY_TO || "info@doxa-threads.com";

// Extract the email portion from EMAIL_FROM (supports both "Name <email>" and raw email formats)
const FROM_EMAIL_MATCH = EMAIL_FROM.match(/<(.+)>/);
const FROM_EMAIL_ADDRESS = FROM_EMAIL_MATCH ? FROM_EMAIL_MATCH[1] : EMAIL_FROM;
const DEFAULT_FROM_NAME = EMAIL_FROM.includes("<")
  ? EMAIL_FROM.split("<")[0].trim()
  : "Doxa Threads";

// Batch configuration
const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 1000; // 1 second between batches

export async function POST(
  req: NextRequest
): Promise<NextResponse<SendBulkEmailResponse>> {
  const startTime = Date.now();

  try {
    // Validate environment variables
    if (!RESEND_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: "",
          error: "RESEND_API_KEY is not configured",
          results: { total: 0, sent: 0, failed: 0, batches: [], errors: [] },
        },
        { status: 500 }
      );
    }

    if (!RESEND_AUDIENCE_ID) {
      return NextResponse.json(
        {
          success: false,
          message: "",
          error: "RESEND_AUDIENCE_ID is not configured",
          results: { total: 0, sent: 0, failed: 0, batches: [], errors: [] },
        },
        { status: 500 }
      );
    }

    // Parse request body
    const body: SendBulkEmailRequest = await req.json();
    const { subject, htmlContent, fromName, replyTo, maxPerHour } = body;

    if (!subject || !htmlContent) {
      return NextResponse.json(
        {
          success: false,
          message: "",
          error: "Missing required fields: subject or htmlContent",
          results: { total: 0, sent: 0, failed: 0, batches: [], errors: [] },
        },
        { status: 400 }
      );
    }

    console.log(`[send-bulk] Starting bulk email campaign: "${subject}"`);

    const resend = new Resend(RESEND_API_KEY);

    // Step 1: Fetch all contacts from Resend Audience
    console.log(`[send-bulk] Fetching contacts from audience ${RESEND_AUDIENCE_ID}`);

    const contactsResponse = await fetch(
      `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!contactsResponse.ok) {
      const errorData = await contactsResponse.json().catch(() => ({}));
      console.error("[send-bulk] Failed to fetch contacts:", errorData);
      return NextResponse.json(
        {
          success: false,
          message: "",
          error: "Failed to fetch contacts from Resend",
          details: errorData,
          results: { total: 0, sent: 0, failed: 0, batches: [], errors: [] },
        },
        { status: contactsResponse.status }
      );
    }

    const contactsData = await contactsResponse.json();
    const allContacts: Contact[] = contactsData.data?.data || [];

    // Filter out unsubscribed contacts
    const activeContacts = allContacts.filter(contact => !contact.unsubscribed);

    if (activeContacts.length === 0) {
      console.warn("[send-bulk] No active contacts found in audience");
      return NextResponse.json(
        {
          success: false,
          message: "",
          error: "No active contacts found in audience",
          results: { total: 0, sent: 0, failed: 0, batches: [], errors: [] },
        },
        { status: 400 }
      );
    }

    console.log(`[send-bulk] Found ${activeContacts.length} active contacts (${allContacts.length - activeContacts.length} unsubscribed)`);

    // Optional hourly rate limit
    const rateLimitPerHour = maxPerHour && Number(maxPerHour) > 0 ? Number(maxPerHour) : null;
    const perEmailDelayMs = rateLimitPerHour ? Math.ceil(3_600_000 / rateLimitPerHour) : 0;
    const effectiveBatchSize = rateLimitPerHour ? Math.min(BATCH_SIZE, 25) : BATCH_SIZE;

    // Step 2: Split contacts into batches
    const contactBatches = batchArray(activeContacts, effectiveBatchSize);
    const totalBatches = contactBatches.length;

    console.log(
      `[send-bulk] Split into ${totalBatches} batches of ${effectiveBatchSize}${
        rateLimitPerHour ? ` with hourly cap ${rateLimitPerHour}/hr (~${perEmailDelayMs}ms between sends)` : ""
      }`
    );

    // Step 3: Send emails in batches
    const results = {
      total: activeContacts.length,
      sent: 0,
      failed: 0,
      batches: [] as BatchResult[],
      errors: [] as any[],
    };

    const fromDisplayName = fromName || DEFAULT_FROM_NAME;
    const fromEmail = `${fromDisplayName} <${FROM_EMAIL_ADDRESS}>`;
    const replyToEmail = replyTo || REPLY_TO;

    for (let batchIndex = 0; batchIndex < contactBatches.length; batchIndex++) {
      const batch = contactBatches[batchIndex];
      const batchNumber = batchIndex + 1;

      console.log(`[send-bulk] Processing batch ${batchNumber}/${totalBatches} (${batch.length} emails)`);

      const batchResult: BatchResult = {
        batchNumber,
        sent: 0,
        failed: 0,
        errors: [],
      };

      try {
        if (rateLimitPerHour) {
          // Sequential send with enforced delay per email
          for (const contact of batch) {
            const sendStart = Date.now();
            try {
              const personalizedContent = personalizeEmail(htmlContent, contact);
              const personalizedSubject = personalizeEmail(subject, contact);
              const contentWithUnsubscribe = addUnsubscribeFooter(personalizedContent, contact.email, contact.id);

              const sendResult = await resend.emails.send({
                from: fromEmail,
                to: contact.email,
                replyTo: replyToEmail,
                subject: personalizedSubject,
                html: contentWithUnsubscribe,
                headers: {
                  "X-Entity-Ref-ID": `bulk-${Date.now()}-${contact.id}`,
                },
                tags: [
                  { name: "campaign", value: "bulk-email" },
                  { name: "batch", value: batchNumber.toString() },
                ],
              });

              if (sendResult.error) {
                console.error(`[send-bulk] Failed to send to ${contact.email}:`, sendResult.error);
                batchResult.failed++;
                results.failed++;
                batchResult.errors?.push({
                  email: contact.email,
                  error: sendResult.error,
                });
              } else {
                batchResult.sent++;
                results.sent++;
              }
            } catch (error) {
              console.error(`[send-bulk] Error sending to ${contact.email}:`, error);
              batchResult.failed++;
              results.failed++;
              batchResult.errors?.push({
                email: contact.email,
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }

            // Enforce per-email pacing
            const elapsed = Date.now() - sendStart;
            const waitMs = perEmailDelayMs - elapsed;
            if (waitMs > 0) {
              await delay(waitMs);
            }
          }
        } else {
          // Prepare personalized emails for this batch (concurrent send)
          const emailPromises = batch.map((contact) => {
            const personalizedContent = personalizeEmail(htmlContent, contact);
            const personalizedSubject = personalizeEmail(subject, contact);
            const contentWithUnsubscribe = addUnsubscribeFooter(personalizedContent, contact.email, contact.id);

            return resend.emails.send({
              from: fromEmail,
              to: contact.email,
              replyTo: replyToEmail,
              subject: personalizedSubject,
              html: contentWithUnsubscribe,
              headers: {
                "X-Entity-Ref-ID": `bulk-${Date.now()}-${contact.id}`,
              },
              tags: [
                { name: "campaign", value: "bulk-email" },
                { name: "batch", value: batchNumber.toString() },
              ],
            });
          });

          // Send all emails in this batch concurrently
          const batchResults = await Promise.allSettled(emailPromises);

          // Process results
          batchResults.forEach((result, index) => {
            if (result.status === "fulfilled") {
              if (result.value.error) {
                console.error(
                  `[send-bulk] Failed to send to ${batch[index].email}:`,
                  result.value.error
                );
                batchResult.failed++;
                results.failed++;
                batchResult.errors?.push({
                  email: batch[index].email,
                  error: result.value.error,
                });
              } else {
                batchResult.sent++;
                results.sent++;
              }
            } else {
              console.error(
                `[send-bulk] Promise rejected for ${batch[index].email}:`,
                result.reason
              );
              batchResult.failed++;
              results.failed++;
              batchResult.errors?.push({
                email: batch[index].email,
                error: result.reason?.message || "Unknown error",
              });
            }
          });
        }

        console.log(
          `[send-bulk] Batch ${batchNumber} complete: ${batchResult.sent} sent, ${batchResult.failed} failed`
        );

        results.batches.push(batchResult);

        // Add errors to global error list if any
        if (batchResult.errors && batchResult.errors.length > 0) {
          results.errors.push(...batchResult.errors);
        }

        // Wait between batches (except for last batch)
        if (batchIndex < contactBatches.length - 1) {
          const waitBetweenBatches = rateLimitPerHour ? Math.max(BATCH_DELAY_MS, perEmailDelayMs) : BATCH_DELAY_MS;
          console.log(`[send-bulk] Waiting ${waitBetweenBatches}ms before next batch...`);
          await delay(waitBetweenBatches);
        }
      } catch (error) {
        console.error(`[send-bulk] Batch ${batchNumber} exception:`, error);

        // Mark all emails in this batch as failed
        batchResult.failed = batch.length;
        results.failed += batch.length;

        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        batchResult.errors = batch.map(contact => ({
          email: contact.email,
          error: errorMessage,
        }));

        results.batches.push(batchResult);
        results.errors.push(...batchResult.errors);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const successRate = ((results.sent / results.total) * 100).toFixed(1);

    console.log(`[send-bulk] Campaign complete in ${duration}s`);
    console.log(`[send-bulk] Results: ${results.sent}/${results.total} sent (${successRate}%), ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Bulk email campaign completed: ${results.sent} sent, ${results.failed} failed`,
      results,
    });
  } catch (error) {
    console.error("[send-bulk] Critical error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "",
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        results: { total: 0, sent: 0, failed: 0, batches: [], errors: [] },
      },
      { status: 500 }
    );
  }
}
