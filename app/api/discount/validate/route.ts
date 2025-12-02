import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { code, email } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: "Discount code is required" },
        { status: 400 }
      );
    }

    const supa = createServiceClient();

    // Fetch the discount code (case-insensitive)
    const { data: discount, error: fetchError } = await supa
      .from("discount_codes")
      .select("*")
      .ilike("code", code.trim())
      .single();

    if (fetchError || !discount) {
      return NextResponse.json(
        { error: "Invalid discount code" },
        { status: 404 }
      );
    }

    // Check if discount is active
    if (!discount.active) {
      return NextResponse.json(
        { error: "This discount code is no longer active" },
        { status: 400 }
      );
    }

    // Check if expired
    if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This discount code has expired" },
        { status: 400 }
      );
    }

    // Check max uses
    if (discount.max_uses && discount.used_count >= discount.max_uses) {
      return NextResponse.json(
        { error: "This discount code has reached its maximum uses" },
        { status: 400 }
      );
    }

    // Check if first order only
    if (discount.first_order_only && email) {
      const { data: existingOrders } = await supa
        .from("orders")
        .select("id")
        .ilike("email", email.trim())
        .eq("status", "PAID")
        .limit(1);

      if (existingOrders && existingOrders.length > 0) {
        return NextResponse.json(
          { error: "This discount code is only valid for first-time customers" },
          { status: 400 }
        );
      }
    }

    // Return valid discount information
    return NextResponse.json({
      valid: true,
      discount: {
        code: discount.code,
        type: discount.discount_type,
        value: discount.discount_value,
        firstOrderOnly: discount.first_order_only
      }
    });

  } catch (error: any) {
    console.error("Discount validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate discount code" },
      { status: 500 }
    );
  }
}
