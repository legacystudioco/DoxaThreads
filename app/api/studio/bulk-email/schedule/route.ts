import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ScheduleEmailRequest, ScheduleEmailResponse } from "../types";

export async function POST(request: NextRequest) {
  try {
    const body: ScheduleEmailRequest = await request.json();
    const { subject, htmlContent, scheduledDate, scheduledTime } = body;

    // Validate required fields
    if (!subject || !htmlContent || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: subject, htmlContent, scheduledDate, or scheduledTime",
        } as ScheduleEmailResponse,
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(scheduledDate)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date format. Use YYYY-MM-DD",
        } as ScheduleEmailResponse,
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(scheduledTime)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid time format. Use HH:MM (24-hour format)",
        } as ScheduleEmailResponse,
        { status: 400 }
      );
    }

    // Combine date and time into a datetime string
    const scheduledDatetime = new Date(`${scheduledDate}T${scheduledTime}:00`);

    // Check if the scheduled time is in the future
    if (scheduledDatetime <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "Scheduled time must be in the future",
        } as ScheduleEmailResponse,
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // Get total contacts count (excluding unsubscribed)
    const { data: contactsData, error: contactsError } = await supabase
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .eq("unsubscribed", false);

    if (contactsError) {
      console.error("Error fetching contacts count:", contactsError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch recipient count",
        } as ScheduleEmailResponse,
        { status: 500 }
      );
    }

    const totalRecipients = contactsData?.length || 0;

    // Insert scheduled email into database
    const { data: scheduledEmail, error: insertError } = await supabase
      .from("scheduled_emails")
      .insert({
        subject,
        html_content: htmlContent,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        scheduled_datetime: scheduledDatetime.toISOString(),
        status: "pending",
        total_recipients: totalRecipients,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error scheduling email:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to schedule email",
        } as ScheduleEmailResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Email scheduled for ${scheduledDate} at ${scheduledTime}`,
        scheduledEmail,
      } as ScheduleEmailResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in schedule email endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      } as ScheduleEmailResponse,
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all scheduled emails
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Fetch all scheduled emails, ordered by scheduled_datetime
    const { data: scheduledEmails, error } = await supabase
      .from("scheduled_emails")
      .select("*")
      .order("scheduled_datetime", { ascending: true });

    if (error) {
      console.error("Error fetching scheduled emails:", error);
      return NextResponse.json(
        {
          success: false,
          scheduledEmails: [],
          error: "Failed to fetch scheduled emails",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        scheduledEmails: scheduledEmails || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in get scheduled emails endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        scheduledEmails: [],
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to cancel a scheduled email
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing email ID",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update status to cancelled
    const { error } = await supabase
      .from("scheduled_emails")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("status", "pending"); // Only cancel if still pending

    if (error) {
      console.error("Error cancelling scheduled email:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to cancel scheduled email",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Email cancelled successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in cancel scheduled email endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
