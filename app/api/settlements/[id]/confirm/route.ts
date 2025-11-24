import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supa = createServiceClient();

  await supa
    .from("settlements")
    .update({ status: "PAID" })
    .eq("id", params.id);

  const { data: joined } = await supa
    .from("settlement_orders")
    .select("order_id")
    .eq("settlement_id", params.id);

  const orderIds = (joined ?? []).map((j: any) => j.order_id);
  if (orderIds.length > 0) {
    await supa
      .from("orders")
      .update({ printer_payable_status: "SETTLED" })
      .in("id", orderIds);
  }

  return NextResponse.json({ ok: true });
}
