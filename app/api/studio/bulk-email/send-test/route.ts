import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { SendTestEmailRequest, SendTestEmailResponse } from "../types";
import { isValidEmail, personalizeEmail, addUnsubscribeFooter } from "../utils";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Doxa Threads <info@doxa-threads.com>";
const REPLY_TO = process.env.REPLY_TO || "info@doxa-threads.com";

// Extract the email portion from EMAIL_FROM (supports both "Name <email>" and raw email formats)
const FROM_EMAIL_MATCH = EMAIL_FROM.match(/<(.+)>/);
const FROM_EMAIL_ADDRESS = FROM_EMAIL_MATCH ? FROM_EMAIL_MATCH[1] : EMAIL_FROM;
const DEFAULT_FROM_NAME = EMAIL_FROM.includes("<")
  ? EMAIL_FROM.split("<")[0].trim()
  : "Doxa Threads";

export async function POST(req: NextRequest): Promise<NextResponse<SendTestEmailResponse>> {
  try {
    if (!RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, message: "", error: "RESEND_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const body: SendTestEmailRequest = await req.json();
    const { testEmail, subject, htmlContent, fromName } = body;

    if (!testEmail || !subject || !htmlContent) {
      return NextResponse.json(
        { success: false, message: "", error: "Missing required fields: testEmail, subject, or htmlContent" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(testEmail)) {
      return NextResponse.json(
        { success: false, message: "", error: "Invalid email format" },
        { status: 400 }
      );
    }

    const resend = new Resend(RESEND_API_KEY);

    // Personalize content with test data
    const testContact = {
      id: "test",
      email: testEmail,
      first_name: "Test",
      last_name: "User",
    };
    const personalizedContent = personalizeEmail(htmlContent, testContact);

    // Add unsubscribe footer for preview
    const contentWithUnsubscribe = addUnsubscribeFooter(personalizedContent, testEmail, "test-contact-id");

    // Build from header using provided name if available
    const fromHeader = fromName
      ? `${fromName} <${FROM_EMAIL_ADDRESS}>`
      : EMAIL_FROM;

    // Send test email with proper headers
    const { data, error } = await resend.emails.send({
      from: fromHeader,
      to: testEmail,
      replyTo: REPLY_TO,
      subject: `[TEST] ${subject}`,
      html: contentWithUnsubscribe,
      headers: {
        "X-Entity-Ref-ID": `test-${Date.now()}`,
      },
    });

    if (error) {
      console.error("[send-test] Resend API error:", error);
      return NextResponse.json(
        { success: false, message: "", error: "Failed to send test email", details: error },
        { status: 500 }
      );
    }

    console.log(`[send-test] Successfully sent test email to ${testEmail} (ID: ${data?.id})`);

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      emailId: data?.id,
    });
  } catch (error) {
    console.error("[send-test] Error sending test email:", error);
    return NextResponse.json(
      { success: false, message: "", error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
