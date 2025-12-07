import { NextRequest, NextResponse } from "next/server";
import { GetContactsResponse, Contact } from "../types";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

export async function GET(req: NextRequest): Promise<NextResponse<GetContactsResponse>> {
  try {
    if (!RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured" },
        { status: 500 }
      );
    }

    if (!RESEND_AUDIENCE_ID) {
      return NextResponse.json(
        { error: "RESEND_AUDIENCE_ID is not configured" },
        { status: 500 }
      );
    }

    // Fetch contacts from Resend Audience API
    const response = await fetch(
      `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Resend API error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch contacts from Resend", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Debug logging (keep output small to avoid noisy logs)
    console.log("[get-contacts] Response structure:", {
      hasData: !!data?.data,
      dataKeys: data?.data ? Object.keys(data.data) : [],
      topLevelKeys: Object.keys(data || {}),
    });

    // Try different possible response structures from Resend
    let contacts: Contact[] = [];

    if (data.data?.data) {
      // Nested structure: { data: { data: [...] } }
      contacts = data.data.data;
      console.log("[get-contacts] Using nested structure (data.data.data)");
    } else if (data.data) {
      // Single level: { data: [...] }
      contacts = Array.isArray(data.data) ? data.data : [];
      console.log("[get-contacts] Using single level (data.data)");
    } else if (Array.isArray(data)) {
      // Direct array: [...]
      contacts = data;
      console.log("[get-contacts] Using direct array");
    }

    console.log("[get-contacts] Total contacts found:", contacts.length);

    // Filter out unsubscribed contacts
    const activeContacts = contacts.filter(contact => !contact.unsubscribed);
    const totalContacts = activeContacts.length;

    console.log("[get-contacts] Active contacts (after filtering):", totalContacts);
    if (activeContacts[0]) {
      console.log("[get-contacts] Sample contact:", {
        email: activeContacts[0].email,
        unsubscribed: activeContacts[0].unsubscribed,
      });
    }

    return NextResponse.json({
      success: true,
      contacts: activeContacts,
      totalContacts,
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
