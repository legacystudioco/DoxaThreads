import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supa = createServiceClient();

  // Mark settlement as paid and log action
  await supa.from("settlements").update({ status: "PAID" }).eq("id", params.id);
  await supa.from("printer_actions").insert({ settlement_id: params.id, action: "PAID_IN_FULL" });

  // Move all joined orders to SETTLED
  const { data: joins } = await supa
    .from("settlement_orders")
    .select("order_id")
    .eq("settlement_id", params.id);

  const orderIds = (joins ?? []).map((j: any) => j.order_id);
  if (orderIds.length) {
    await supa
      .from("orders")
      .update({ printer_payable_status: "SETTLED" })
      .in("id", orderIds);
  }

  const redirectUrl = new URL(
    "/studio/settlements?ok=paid",
    process.env.SITE_URL || "http://localhost:3000"
  );
  return NextResponse.redirect(redirectUrl);
}
