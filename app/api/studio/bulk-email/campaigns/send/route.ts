import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { Contact } from "../../types";
import { personalizeEmail, addUnsubscribeFooter } from "../../utils";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID!;
const EMAIL_FROM = process.env.EMAIL_FROM || "Doxa Threads <info@doxa-threads.com>";
const REPLY_TO = process.env.REPLY_TO || "info@doxa-threads.com";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Extract the email portion from EMAIL_FROM
const FROM_EMAIL_MATCH = EMAIL_FROM.match(/<(.+)>/);
const FROM_EMAIL_ADDRESS = FROM_EMAIL_MATCH ? FROM_EMAIL_MATCH[1] : EMAIL_FROM;
const DEFAULT_FROM_NAME = EMAIL_FROM.includes("<")
  ? EMAIL_FROM.split("<")[0].trim()
  : "Doxa Threads";

/**
 * POST - Send or resume a campaign
 *
 * Body params:
 * - campaignId: UUID of existing campaign to resume (optional)
 * - name: Campaign name (required if creating new)
 * - subject: Email subject (required if creating new)
 * - htmlContent: Email HTML content (required if creating new)
 * - fromName: Sender name (optional)
 * - maxPerBatch: Max emails to send in this batch (default: 300)
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { campaignId, name, subject, htmlContent, fromName, maxPerBatch = 300 } = body;

    const resend = new Resend(RESEND_API_KEY);
    let campaign: any;

    // Step 1: Get or create campaign
    if (campaignId) {
      console.log(`[campaign-send] Resuming campaign ${campaignId}`);

      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 }
        );
      }

      campaign = data;
    } else {
      console.log(`[campaign-send] Creating new campaign: "${name}"`);

      if (!name || !subject || !htmlContent) {
        return NextResponse.json(
          { error: "Missing required fields: name, subject, htmlContent" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("email_campaigns")
        .insert({
          name,
          subject,
          html_content: htmlContent,
          from_name: fromName,
          max_per_batch: maxPerBatch,
          status: "sending",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("[campaign-send] Error creating campaign:", error);
        return NextResponse.json(
          { error: "Failed to create campaign" },
          { status: 500 }
        );
      }

      campaign = data;
    }

    // Step 2: Fetch all contacts from Resend
    console.log(`[campaign-send] Fetching contacts from audience ${RESEND_AUDIENCE_ID}`);

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
      return NextResponse.json(
        { error: "Failed to fetch contacts from Resend" },
        { status: contactsResponse.status }
      );
    }

    const contactsData = await contactsResponse.json();

    // Flexibly extract contacts
    let allContacts: Contact[] = [];
    if (contactsData?.data?.data) {
      allContacts = contactsData.data.data;
    } else if (Array.isArray(contactsData?.data)) {
      allContacts = contactsData.data;
    } else if (Array.isArray(contactsData)) {
      allContacts = contactsData;
    }

    const activeContacts = allContacts.filter((contact) => !contact.unsubscribed);

    if (activeContacts.length === 0) {
      return NextResponse.json(
        { error: "No active contacts found in audience" },
        { status: 400 }
      );
    }

    console.log(`[campaign-send] Found ${activeContacts.length} active contacts`);

    // Step 3: Get already-sent recipients for this campaign
    const { data: sentRecipients, error: sentError } = await supabase
      .from("campaign_recipients")
      .select("contact_id")
      .eq("campaign_id", campaign.id)
      .eq("status", "sent");

    if (sentError) {
      console.error("[campaign-send] Error fetching sent recipients:", sentError);
    }

    const sentContactIds = new Set(
      sentRecipients?.map((r) => r.contact_id) || []
    );

    // Filter out already-sent contacts
    const remainingContacts = activeContacts.filter(
      (contact) => !sentContactIds.has(contact.id)
    );

    console.log(
      `[campaign-send] ${remainingContacts.length} contacts remaining (${sentContactIds.size} already sent)`
    );

    if (remainingContacts.length === 0) {
      // Mark campaign as completed
      await supabase
        .from("email_campaigns")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", campaign.id);

      return NextResponse.json({
        success: true,
        message: "Campaign already completed - all recipients have been sent emails",
        campaign,
        results: {
          total: activeContacts.length,
          sent: sentContactIds.size,
          failed: 0,
          remaining: 0,
        },
      });
    }

    // Step 4: Take only maxPerBatch contacts
    const batchContacts = remainingContacts.slice(0, maxPerBatch);
    console.log(`[campaign-send] Sending to ${batchContacts.length} contacts in this batch`);

    // Update campaign status
    await supabase
      .from("email_campaigns")
      .update({
        status: "sending",
        total_recipients: activeContacts.length,
      })
      .eq("id", campaign.id);

    // Step 5: Create recipient records
    const recipientRecords = batchContacts.map((contact) => ({
      campaign_id: campaign.id,
      contact_id: contact.id,
      email: contact.email,
      first_name: contact.first_name,
      last_name: contact.last_name,
      status: "pending",
    }));

    const { error: insertError } = await supabase
      .from("campaign_recipients")
      .insert(recipientRecords);

    if (insertError) {
      console.error("[campaign-send] Error inserting recipients:", insertError);
      return NextResponse.json(
        { error: "Failed to create recipient records" },
        { status: 500 }
      );
    }

    // Step 6: Send emails using batch API
    const results = {
      total: batchContacts.length,
      sent: 0,
      failed: 0,
    };

    const fromDisplayName = campaign.from_name || fromName || DEFAULT_FROM_NAME;
    const fromEmail = `${fromDisplayName} <${FROM_EMAIL_ADDRESS}>`;
    const replyToEmail = REPLY_TO;

    // Prepare batch emails
    const batchEmails = batchContacts.map((contact) => {
      const personalizedContent = personalizeEmail(campaign.html_content, contact);
      const personalizedSubject = personalizeEmail(campaign.subject, contact);
      const contentWithUnsubscribe = addUnsubscribeFooter(
        personalizedContent,
        contact.email,
        contact.id
      );

      return {
        from: fromEmail,
        to: contact.email,
        reply_to: replyToEmail,
        subject: personalizedSubject,
        html: contentWithUnsubscribe,
        headers: {
          "X-Entity-Ref-ID": `campaign-${campaign.id}-${contact.id}`,
        },
        tags: [
          { name: "campaign_id", value: campaign.id.replace(/-/g, "_") },
          { name: "campaign_name", value: campaign.name.replace(/[^a-zA-Z0-9_-]/g, "_") },
        ],
      };
    });

    // Resend batch API has a 100 email limit, so split into chunks
    const BATCH_SIZE = 100;
    const chunks = [];
    for (let i = 0; i < batchEmails.length; i += BATCH_SIZE) {
      chunks.push({
        emails: batchEmails.slice(i, i + BATCH_SIZE),
        contacts: batchContacts.slice(i, i + BATCH_SIZE),
      });
    }

    console.log(`[campaign-send] Sending ${batchEmails.length} emails in ${chunks.length} chunks of ${BATCH_SIZE}...`);

    // Send each chunk
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      console.log(`[campaign-send] Sending chunk ${chunkIndex + 1}/${chunks.length} (${chunk.emails.length} emails)...`);

      const batchResult = await resend.batch.send(chunk.emails);

      if (batchResult.error) {
        console.error(`[campaign-send] Chunk ${chunkIndex + 1} error:`, JSON.stringify(batchResult.error, null, 2));

        // Mark chunk as failed
        await supabase
          .from("campaign_recipients")
          .update({
            status: "failed",
            error_message: JSON.stringify(batchResult.error),
          })
          .eq("campaign_id", campaign.id)
          .in("contact_id", chunk.contacts.map(c => c.id));

        results.failed += chunk.contacts.length;
      } else if (batchResult.data?.data) {
        console.log(`[campaign-send] Chunk ${chunkIndex + 1} sent successfully: ${batchResult.data.data.length} emails`);

        // Mark chunk as sent
        const now = new Date().toISOString();
        await supabase
          .from("campaign_recipients")
          .update({
            status: "sent",
            sent_at: now,
          })
          .eq("campaign_id", campaign.id)
          .in("contact_id", chunk.contacts.map(c => c.id));

        results.sent += chunk.contacts.length;
      } else {
        console.error(`[campaign-send] Chunk ${chunkIndex + 1} unexpected result:`, batchResult);

        // Mark chunk as failed
        await supabase
          .from("campaign_recipients")
          .update({
            status: "failed",
            error_message: "Unexpected batch result structure",
          })
          .eq("campaign_id", campaign.id)
          .in("contact_id", chunk.contacts.map(c => c.id));

        results.failed += chunk.contacts.length;
      }
    }

    console.log(`[campaign-send] All chunks complete. Sent: ${results.sent}, Failed: ${results.failed}`);

    // Step 7: Update campaign stats
    const totalSent = sentContactIds.size + results.sent;
    const totalFailed = results.failed;
    const isComplete = totalSent + totalFailed >= activeContacts.length;

    await supabase
      .from("email_campaigns")
      .update({
        sent_count: totalSent,
        failed_count: totalFailed,
        status: isComplete ? "completed" : "paused",
        completed_at: isComplete ? new Date().toISOString() : null,
      })
      .eq("id", campaign.id);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[campaign-send] Batch complete in ${duration}s`);
    console.log(`[campaign-send] Sent: ${results.sent}, Failed: ${results.failed}`);

    return NextResponse.json({
      success: true,
      message: `Batch sent: ${results.sent} emails sent, ${results.failed} failed`,
      campaign: {
        ...campaign,
        sent_count: totalSent,
        failed_count: totalFailed,
        status: isComplete ? "completed" : "paused",
      },
      results: {
        total: activeContacts.length,
        sent: totalSent,
        failed: totalFailed,
        remaining: activeContacts.length - totalSent - totalFailed,
        thisBatch: results,
      },
    });
  } catch (error) {
    console.error("[campaign-send] Critical error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
