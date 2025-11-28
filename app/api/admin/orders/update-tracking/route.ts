import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { orderId, trackingNumber, carrier } = await req.json();

    if (!orderId || !trackingNumber) {
      return NextResponse.json(
        { error: "Order ID and tracking number are required" },
        { status: 400 }
      );
    }

    const supa = createServiceClient();

    // Update the order with tracking information
    const { error: updateError } = await supa
      .from("orders")
      .update({
        tracking_number: trackingNumber,
        carrier: carrier || "USPS",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating tracking:", updateError);
      return NextResponse.json(
        { error: "Failed to update tracking information" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tracking information updated successfully",
    });
  } catch (error) {
    console.error("Error updating tracking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
