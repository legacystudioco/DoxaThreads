import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { personalizeEmail, addUnsubscribeFooter } from "../utils";

const resend = new Resend(process.env.RESEND_API_KEY);
const BATCH_SIZE = 100; // Send in batches of 100
const BATCH_DELAY = 1000; // 1 second delay between batches

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check for cron job
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Fetch all pending scheduled emails that are due
    const now = new Date();
    const { data: dueEmails, error: fetchError } = await supabase
      .from("scheduled_emails")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_datetime", now.toISOString());

    if (fetchError) {
      console.error("Error fetching due emails:", fetchError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch scheduled emails" },
        { status: 500 }
      );
    }

    if (!dueEmails || dueEmails.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "No scheduled emails are due",
          processed: 0,
        },
        { status: 200 }
      );
    }

    const results = [];

    // Process each scheduled email
    for (const scheduledEmail of dueEmails) {
      try {
        // Fetch all active contacts
        const { data: contacts, error: contactsError } = await supabase
          .from("newsletter_subscribers")
          .select("email, first_name, last_name")
          .eq("unsubscribed", false);

        if (contactsError || !contacts || contacts.length === 0) {
          // Mark as failed
          await supabase
            .from("scheduled_emails")
            .update({
              status: "failed",
              error_message: "No active contacts found",
              sent_at: now.toISOString(),
            })
            .eq("id", scheduledEmail.id);

          results.push({
            id: scheduledEmail.id,
            status: "failed",
            error: "No active contacts found",
          });
          continue;
        }

        let totalSent = 0;
        let totalFailed = 0;
        const errors: any[] = [];

        // Process contacts in batches
        const batches = [];
        for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
          batches.push(contacts.slice(i, i + BATCH_SIZE));
        }

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];

          // Send emails in parallel for this batch
          const batchPromises = batch.map(async (contact) => {
            try {
              // Personalize subject and content
              const personalizedSubject = personalizeEmail(
                scheduledEmail.subject,
                contact
              );
              const personalizedHtml = personalizeEmail(
                scheduledEmail.html_content,
                contact
              );

              // Add unsubscribe footer (use contact email as ID if no id field exists)
              const contactId = (contact as any).id || contact.email;
              const htmlWithUnsubscribe = addUnsubscribeFooter(
                personalizedHtml,
                contact.email,
                contactId
              );

              const { data, error } = await resend.emails.send({
                from: "Doxa Threads <info@doxa-threads.com>",
                to: contact.email,
                subject: personalizedSubject,
                html: htmlWithUnsubscribe,
              });

              if (error) {
                console.error(
                  `Failed to send to ${contact.email}:`,
                  error
                );
                errors.push({ email: contact.email, error });
                return { success: false };
              }

              return { success: true };
            } catch (error) {
              console.error(`Error sending to ${contact.email}:`, error);
              errors.push({ email: contact.email, error });
              return { success: false };
            }
          });

          const batchResults = await Promise.all(batchPromises);
          const batchSent = batchResults.filter((r) => r.success).length;
          const batchFailed = batchResults.filter((r) => !r.success).length;

          totalSent += batchSent;
          totalFailed += batchFailed;

          // Delay between batches (except for the last batch)
          if (i < batches.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
          }
        }

        // Update scheduled email status
        await supabase
          .from("scheduled_emails")
          .update({
            status: totalFailed === 0 ? "sent" : "failed",
            sent_at: now.toISOString(),
            sent_count: totalSent,
            failed_count: totalFailed,
            error_message:
              totalFailed > 0
                ? `${totalFailed} emails failed to send`
                : null,
          })
          .eq("id", scheduledEmail.id);

        results.push({
          id: scheduledEmail.id,
          status: totalFailed === 0 ? "sent" : "partial",
          sent: totalSent,
          failed: totalFailed,
        });
      } catch (error) {
        console.error(
          `Error processing scheduled email ${scheduledEmail.id}:`,
          error
        );

        // Mark as failed
        await supabase
          .from("scheduled_emails")
          .update({
            status: "failed",
            error_message:
              error instanceof Error ? error.message : "Unknown error",
            sent_at: now.toISOString(),
          })
          .eq("id", scheduledEmail.id);

        results.push({
          id: scheduledEmail.id,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Processed ${results.length} scheduled email(s)`,
        processed: results.length,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in process scheduled emails endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
