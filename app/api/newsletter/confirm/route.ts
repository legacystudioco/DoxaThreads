import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { sendCustomerEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DISCOUNT_CODE = "DOXA-WELCOME";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

async function syncToResendAudience(email: string) {
  if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
    console.warn("[newsletter-confirm] Skipping Resend sync: missing RESEND_API_KEY or RESEND_AUDIENCE_ID");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          unsubscribed: false,
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    // If the contact already exists in the audience, treat as success
    if (!response.ok) {
      const message: string = data?.error || data?.message || "";
      const looksLikeDuplicate = /already exists|duplicate/i.test(message);

      if (response.status === 409 || response.status === 422 || looksLikeDuplicate) {
        console.log(`[newsletter-confirm] Contact already exists in Resend audience: ${email}`);
        return null;
      }

      console.error("[newsletter-confirm] Failed to add contact to Resend audience", {
        status: response.status,
        data,
      });
      return null;
    }

    const contactId = data?.data?.id || data?.id || null;
    console.log(`[newsletter-confirm] Synced contact to Resend audience: ${email} (id: ${contactId ?? "unknown"})`);
    return contactId;
  } catch (error) {
    console.error("[newsletter-confirm] Error syncing contact to Resend audience", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: "Invalid confirmation token" },
        { status: 400 }
      );
    }

    const supa = createServiceClient();

    // Find subscriber by token
    const { data: subscriber, error: fetchError } = await supa
      .from("newsletter_subscribers")
      .select("*")
      .eq("confirmation_token", token)
      .single();

    if (fetchError || !subscriber) {
      return NextResponse.json(
        { error: "Invalid or expired confirmation link" },
        { status: 404 }
      );
    }

    // Check if already confirmed
    if (subscriber.confirmed) {
      await syncToResendAudience(subscriber.email);

      // If already sent the code, just return it
      if (subscriber.discount_code_sent && subscriber.discount_code) {
        return NextResponse.json({
          success: true,
          discountCode: subscriber.discount_code,
          message: "Your subscription was already confirmed."
        });
      }
    }

    // Update subscriber to confirmed and set discount code
    const { error: updateError } = await supa
      .from("newsletter_subscribers")
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
        discount_code: DISCOUNT_CODE,
        discount_code_sent: true,
      })
      .eq("id", subscriber.id);

    if (updateError) {
      console.error("Error updating subscriber:", updateError);
      return NextResponse.json(
        { error: "Failed to confirm subscription" },
        { status: 500 }
      );
    }

    await syncToResendAudience(subscriber.email);

    // Send welcome email with discount code
    await sendWelcomeEmail(subscriber.email, DISCOUNT_CODE);

    return NextResponse.json({
      success: true,
      discountCode: DISCOUNT_CODE,
      message: "Subscription confirmed!"
    });

  } catch (error: any) {
    console.error("Newsletter confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to confirm subscription" },
      { status: 500 }
    );
  }
}

async function sendWelcomeEmail(email: string, discountCode: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1E2A44;
            margin: 0;
            padding: 0;
            background-color: #F3E8D8;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .card {
            background: #FFFFFF;
            border: 2px solid #C59849;
            padding: 40px;
            text-align: center;
          }
          .logo {
            margin-bottom: 24px;
          }
          h1 {
            color: #1E2A44;
            font-size: 28px;
            margin: 0 0 16px 0;
            font-weight: 700;
          }
          p {
            color: rgba(30, 42, 68, 0.8);
            margin: 16px 0;
          }
          .code-box {
            background: #1E2A44;
            color: #F3E8D8;
            padding: 24px;
            margin: 24px 0;
            border: 1px solid #C59849;
          }
          .code {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 2px;
            margin: 8px 0;
          }
          .btn {
            display: inline-block;
            background: #1E2A44;
            color: #F3E8D8;
            padding: 16px 32px;
            text-decoration: none;
            margin: 24px 0;
            font-weight: 600;
            border: 1px solid #C59849;
          }
          .footer {
            text-align: center;
            margin-top: 32px;
            color: rgba(30, 42, 68, 0.6);
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="logo">
              <h1>DOXA THREADS</h1>
            </div>

            <h1>Welcome to the DOXA Family!</h1>

            <p>Your email has been confirmed! We're thrilled to have you join our community.</p>

            <div class="code-box">
              <p style="font-size: 14px; margin: 0 0 8px 0; color: rgba(243, 232, 216, 0.9);">
                Your Exclusive Discount Code:
              </p>
              <div class="code">${discountCode}</div>
              <p style="font-size: 14px; margin: 8px 0 0 0; color: rgba(243, 232, 216, 0.9);">
                20% off your first purchase
              </p>
            </div>

            <p>This code is valid for first-time customers only. Use it at checkout to save on your first order!</p>

            <a href="${baseUrl}/store" class="btn">Shop Now</a>

            <p style="margin-top: 32px; font-size: 14px;">
              You'll also be the first to know about new drops, exclusive offers, and DOXA news.
            </p>
          </div>

          <div class="footer">
            <p>Greek for Glory. Worn with honor. Backed by faith.</p>
            <p>
              <a href="${baseUrl}/unsubscribe" style="color: rgba(30, 42, 68, 0.6);">Unsubscribe</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Welcome to the DOXA Family!

Your email has been confirmed! We're thrilled to have you join our community.

Your Exclusive Discount Code: ${discountCode}
20% off your first purchase

This code is valid for first-time customers only. Use it at checkout to save on your first order!

Shop now: ${baseUrl}/store

You'll also be the first to know about new drops, exclusive offers, and DOXA news.

Greek for Glory. Worn with honor. Backed by faith.

To unsubscribe, visit: ${baseUrl}/unsubscribe
  `;

  await sendCustomerEmail({
    to: email,
    subject: "Your DOXA Welcome Code: 20% Off!",
    html,
    text,
    tags: [
      { name: "category", value: "newsletter" },
      { name: "type", value: "welcome" }
    ]
  });
}
