import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supa = createServiceClient();

    // Fetch order
    const { data: order, error: orderError } = await supa
      .from("orders")
      .select("*")
      .eq("id", params.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Fetch order items
    const { data: items, error: itemsError } = await supa
      .from("order_items")
      .select("*")
      .eq("order_id", params.id);

    if (itemsError) {
      return NextResponse.json(
        { error: "Failed to fetch order items" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      order,
      items: items || [],
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
