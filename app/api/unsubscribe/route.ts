import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || "your-secret-key-change-this";

/**
 * Generates a secure token for unsubscribe links
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
 * Verifies and decodes an unsubscribe token
 */
function verifyUnsubscribeToken(token: string): { email: string; contactId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString());
    const { email, contactId, signature } = decoded;

    // Verify signature
    const data = `${email}:${contactId}`;
    const hmac = crypto.createHmac("sha256", UNSUBSCRIBE_SECRET);
    hmac.update(data);
    const expectedSignature = hmac.digest("hex");

    if (signature !== expectedSignature) {
      console.error("[unsubscribe] Invalid signature");
      return null;
    }

    return { email, contactId };
  } catch (error) {
    console.error("[unsubscribe] Failed to decode token:", error);
    return null;
  }
}

/**
 * POST /api/unsubscribe
 * Unsubscribes a contact from the Resend audience
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing unsubscribe token" },
        { status: 400 }
      );
    }

    // Verify and decode token
    const decoded = verifyUnsubscribeToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired unsubscribe token" },
        { status: 400 }
      );
    }

    const { email, contactId } = decoded;

    // Validate environment variables
    if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
      console.error("[unsubscribe] Missing Resend configuration");
      return NextResponse.json(
        { success: false, error: "Email service configuration error" },
        { status: 500 }
      );
    }

    console.log(`[unsubscribe] Unsubscribing ${email} (ID: ${contactId})`);

    // Mark contact as unsubscribed in Resend
    const response = await fetch(
      `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts/${contactId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unsubscribed: true,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[unsubscribe] Failed to unsubscribe contact:", errorData);

      // If contact not found, still return success (they're effectively unsubscribed)
      if (response.status === 404) {
        console.log("[unsubscribe] Contact not found, considering as unsubscribed");
        return NextResponse.json({
          success: true,
          message: "You have been unsubscribed successfully",
          email,
        });
      }

      return NextResponse.json(
        { success: false, error: "Failed to process unsubscribe request" },
        { status: response.status }
      );
    }

    console.log(`[unsubscribe] Successfully unsubscribed ${email}`);

    return NextResponse.json({
      success: true,
      message: "You have been unsubscribed successfully",
      email,
    });
  } catch (error) {
    console.error("[unsubscribe] Error processing unsubscribe:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/unsubscribe?token=xxx
 * One-click unsubscribe endpoint (for email links)
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/unsubscribe?error=missing_token", req.url));
    }

    // Verify and decode token
    const decoded = verifyUnsubscribeToken(token);
    if (!decoded) {
      return NextResponse.redirect(new URL("/unsubscribe?error=invalid_token", req.url));
    }

    const { email, contactId } = decoded;

    // Validate environment variables
    if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
      console.error("[unsubscribe] Missing Resend configuration");
      return NextResponse.redirect(new URL("/unsubscribe?error=server_error", req.url));
    }

    console.log(`[unsubscribe] One-click unsubscribe for ${email} (ID: ${contactId})`);

    // Mark contact as unsubscribed in Resend
    const response = await fetch(
      `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts/${contactId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unsubscribed: true,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[unsubscribe] Failed to unsubscribe contact:", errorData);

      // If contact not found, still redirect to success (they're effectively unsubscribed)
      if (response.status === 404) {
        console.log("[unsubscribe] Contact not found, considering as unsubscribed");
        return NextResponse.redirect(new URL(`/unsubscribe?success=true&email=${encodeURIComponent(email)}`, req.url));
      }

      return NextResponse.redirect(new URL("/unsubscribe?error=server_error", req.url));
    }

    console.log(`[unsubscribe] Successfully unsubscribed ${email}`);

    // Redirect to success page
    return NextResponse.redirect(new URL(`/unsubscribe?success=true&email=${encodeURIComponent(email)}`, req.url));
  } catch (error) {
    console.error("[unsubscribe] Error processing one-click unsubscribe:", error);
    return NextResponse.redirect(new URL("/unsubscribe?error=server_error", req.url));
  }
}
