import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role for server-side tracking (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      session_id,
      page_path,
      referrer,
      user_agent,
    } = body;

    // Validate required fields
    if (!session_id || !page_path) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get IP address from request headers
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ipAddress = forwardedFor?.split(",")[0] || realIp || null;

    // Get location data from IP
    let locationData: any = null;
    if (ipAddress) {
      try {
        const locationResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`);
        if (locationResponse.ok) {
          locationData = await locationResponse.json();
        }
      } catch (error) {
        console.warn("Failed to fetch location data:", error);
      }
    }

    // Insert visitor event using service role (bypasses RLS)
    const { data, error } = await supabase
      .from("visitor_events")
      .insert({
        session_id,
        page_path,
        referrer: referrer || null,
        user_agent: user_agent || null,
        city: locationData?.city || null,
        region: locationData?.region || null,
        country: locationData?.country_name || null,
        country_code: locationData?.country_code || null,
        latitude: locationData?.latitude || null,
        longitude: locationData?.longitude || null,
        ip_address: ipAddress,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to track visitor:", error);
      return NextResponse.json(
        { error: "Failed to track visitor" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error("Error tracking visitor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
