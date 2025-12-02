import { NextRequest } from "next/server";
import { Resend } from "resend";
import { Contact, BatchResult } from "../types";
import { personalizeEmail, batchArray, delay } from "../utils";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
const EMAIL_FROM = process.env.EMAIL_FROM || "Doxa Threads <info@doxa-threads.com>";
const REPLY_TO = process.env.REPLY_TO || "info@doxa-threads.com";

// Batch configuration
const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 1000;

/**
 * Server-Sent Events endpoint for real-time bulk email progress
 * Streams progress updates as emails are being sent
 */
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send SSE message
      const sendSSE = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      try {
        // Validate environment variables
        if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
          sendSSE({
            type: "error",
            error: "Server configuration error",
          });
          controller.close();
          return;
        }

        // Parse request body
        const body = await req.json();
        const { subject, htmlContent, fromName, replyTo } = body;

        if (!subject || !htmlContent) {
          sendSSE({
            type: "error",
            error: "Missing required fields",
          });
          controller.close();
          return;
        }

        sendSSE({
          type: "started",
          message: "Fetching contacts...",
        });

        const resend = new Resend(RESEND_API_KEY);

        // Fetch contacts
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
          sendSSE({
            type: "error",
            error: "Failed to fetch contacts",
          });
          controller.close();
          return;
        }

        const contactsData = await contactsResponse.json();
        const allContacts: Contact[] = contactsData.data?.data || [];
        const activeContacts = allContacts.filter(contact => !contact.unsubscribed);

        if (activeContacts.length === 0) {
          sendSSE({
            type: "error",
            error: "No active contacts found",
          });
          controller.close();
          return;
        }

        const contactBatches = batchArray(activeContacts, BATCH_SIZE);
        const totalBatches = contactBatches.length;

        sendSSE({
          type: "initialized",
          total: activeContacts.length,
          batches: totalBatches,
        });

        // Send emails in batches
        const results = {
          total: activeContacts.length,
          sent: 0,
          failed: 0,
          batches: [] as BatchResult[],
          errors: [] as any[],
        };

        const fromEmail = fromName ? `${fromName} <info@doxa-threads.com>` : EMAIL_FROM;
        const replyToEmail = replyTo || REPLY_TO;

        for (let batchIndex = 0; batchIndex < contactBatches.length; batchIndex++) {
          const batch = contactBatches[batchIndex];
          const batchNumber = batchIndex + 1;

          sendSSE({
            type: "batch_started",
            batchNumber,
            totalBatches,
            progress: Math.round((batchIndex / totalBatches) * 100),
          });

          const batchResult: BatchResult = {
            batchNumber,
            sent: 0,
            failed: 0,
            errors: [],
          };

          try {
            const emailPromises = batch.map((contact) => {
              const personalizedContent = personalizeEmail(htmlContent, contact);
              const personalizedSubject = personalizeEmail(subject, contact);

              return resend.emails.send({
                from: fromEmail,
                to: contact.email,
                replyTo: replyToEmail,
                subject: personalizedSubject,
                html: personalizedContent,
                headers: {
                  "X-Entity-Ref-ID": `bulk-${Date.now()}-${contact.id}`,
                },
                tags: [
                  { name: "campaign", value: "bulk-email" },
                  { name: "batch", value: batchNumber.toString() },
                ],
              });
            });

            const batchResults = await Promise.allSettled(emailPromises);

            batchResults.forEach((result, index) => {
              if (result.status === "fulfilled" && !result.value.error) {
                batchResult.sent++;
                results.sent++;
              } else {
                batchResult.failed++;
                results.failed++;
                batchResult.errors?.push({
                  email: batch[index].email,
                  error: result.status === "fulfilled" ? result.value.error : result.reason?.message,
                });
              }
            });

            results.batches.push(batchResult);

            if (batchResult.errors && batchResult.errors.length > 0) {
              results.errors.push(...batchResult.errors);
            }

            sendSSE({
              type: "batch_completed",
              batchNumber,
              totalBatches,
              sent: batchResult.sent,
              failed: batchResult.failed,
              totalSent: results.sent,
              totalFailed: results.failed,
              progress: Math.round(((batchIndex + 1) / totalBatches) * 100),
            });

            if (batchIndex < contactBatches.length - 1) {
              await delay(BATCH_DELAY_MS);
            }
          } catch (error) {
            batchResult.failed = batch.length;
            results.failed += batch.length;

            sendSSE({
              type: "batch_error",
              batchNumber,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        sendSSE({
          type: "completed",
          results,
        });

        controller.close();
      } catch (error) {
        sendSSE({
          type: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
