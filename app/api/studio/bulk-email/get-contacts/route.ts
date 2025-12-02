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

    // Resend returns { data: { data: [...contacts], ...pagination } }
    const contacts: Contact[] = data.data?.data || [];

    // Filter out unsubscribed contacts
    const activeContacts = contacts.filter(contact => !contact.unsubscribed);
    const totalContacts = activeContacts.length;

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
