import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { sendCustomerEmail } from "@/lib/email";
import crypto from "crypto";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const supa = createServiceClient();
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const { data: existing } = await supa
      .from("newsletter_subscribers")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (existing) {
      if (existing.confirmed) {
        return NextResponse.json(
          { error: "This email is already subscribed to our newsletter" },
          { status: 400 }
        );
      } else {
        // Resend confirmation email with existing token
        await sendConfirmationEmail(normalizedEmail, existing.confirmation_token);
        return NextResponse.json({
          success: true,
          message: "Confirmation email resent. Please check your inbox."
        });
      }
    }

    // Generate confirmation token
    const confirmationToken = crypto.randomBytes(32).toString("hex");

    // Insert new subscriber
    const { error: insertError } = await supa
      .from("newsletter_subscribers")
      .insert({
        email: normalizedEmail,
        confirmation_token: confirmationToken,
        confirmed: false,
        discount_code_sent: false,
      });

    if (insertError) {
      console.error("Error inserting newsletter subscriber:", insertError);
      return NextResponse.json(
        { error: "Failed to subscribe. Please try again." },
        { status: 500 }
      );
    }

    // Send confirmation email
    await sendConfirmationEmail(normalizedEmail, confirmationToken);

    return NextResponse.json({
      success: true,
      message: "Please check your email to confirm your subscription."
    });

  } catch (error: any) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  }
}

async function sendConfirmationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const confirmationUrl = `${baseUrl}/newsletter/confirm?token=${token}`;

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
          .discount-highlight {
            color: #8B1C1C;
            font-weight: 700;
            font-size: 24px;
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
          .btn:hover {
            background: #2A3A5A;
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

            <h1>Welcome to DOXA!</h1>

            <p>Thank you for joining our community. We're excited to have you!</p>

            <p class="discount-highlight">Get 20% off your first purchase</p>

            <p>Click the button below to confirm your email and receive your exclusive discount code:</p>

            <a href="${confirmationUrl}" class="btn">Confirm My Email</a>

            <p style="font-size: 12px; margin-top: 32px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${confirmationUrl}" style="color: #1E2A44;">${confirmationUrl}</a>
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
Welcome to DOXA THREADS!

Thank you for joining our community. We're excited to have you!

Get 20% off your first purchase!

Confirm your email to receive your exclusive discount code:
${confirmationUrl}

Greek for Glory. Worn with honor. Backed by faith.

To unsubscribe, visit: ${baseUrl}/unsubscribe
  `;

  await sendCustomerEmail({
    to: email,
    subject: "Welcome to DOXA! Confirm Your Email for 20% Off",
    html,
    text,
    tags: [
      { name: "category", value: "newsletter" },
      { name: "type", value: "confirmation" }
    ]
  });
}
