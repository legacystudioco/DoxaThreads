import { NextRequest, NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

/**
 * Debug endpoint to test Resend API connection and see raw response
 * Access at: /api/studio/bulk-email/debug-resend
 */
export async function GET(req: NextRequest) {
  try {
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      envCheck: {
        hasApiKey: !!RESEND_API_KEY,
        apiKeyPrefix: RESEND_API_KEY ? RESEND_API_KEY.substring(0, 8) + "..." : "NOT SET",
        hasAudienceId: !!RESEND_AUDIENCE_ID,
        audienceId: RESEND_AUDIENCE_ID || "NOT SET",
      },
    };

    if (!RESEND_API_KEY) {
      return NextResponse.json({
        error: "RESEND_API_KEY is not set in environment variables",
        debugInfo,
      }, { status: 500 });
    }

    if (!RESEND_AUDIENCE_ID) {
      return NextResponse.json({
        error: "RESEND_AUDIENCE_ID is not set in environment variables",
        debugInfo,
      }, { status: 500 });
    }

    // Test API connection with audiences list
    console.log("[debug-resend] Testing Resend API connection...");
    const audiencesResponse = await fetch(
      "https://api.resend.com/audiences",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const audiencesData = await audiencesResponse.json();
    debugInfo.audiencesEndpoint = {
      status: audiencesResponse.status,
      ok: audiencesResponse.ok,
      data: audiencesData,
    };

    console.log("[debug-resend] Audiences response:", JSON.stringify(audiencesData, null, 2));

    // Test contacts endpoint
    console.log(`[debug-resend] Fetching contacts from audience: ${RESEND_AUDIENCE_ID}`);
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

    const contactsData = await contactsResponse.json();
    debugInfo.contactsEndpoint = {
      status: contactsResponse.status,
      ok: contactsResponse.ok,
      url: `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`,
      data: contactsData,
      responseStructure: {
        topLevelKeys: Object.keys(contactsData),
        hasData: "data" in contactsData,
        dataType: contactsData.data ? typeof contactsData.data : "N/A",
        isDataArray: Array.isArray(contactsData.data),
        dataKeys: contactsData.data && typeof contactsData.data === "object" ? Object.keys(contactsData.data) : [],
      },
    };

    console.log("[debug-resend] Contacts response:", JSON.stringify(contactsData, null, 2));

    if (!contactsResponse.ok) {
      debugInfo.error = "Contacts API request failed";
      debugInfo.errorDetails = contactsData;
    }

    return NextResponse.json(debugInfo, { status: 200 });

  } catch (error) {
    console.error("[debug-resend] Error:", error);
    return NextResponse.json({
      error: "Exception occurred",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
