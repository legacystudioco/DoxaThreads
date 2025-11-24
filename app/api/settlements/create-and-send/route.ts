

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { sendPrinterSettlementEmail } from "@/lib/email";

const PRINTER_EMAIL = process.env.PRINTER_EMAIL || "orders@sticknstitch.com";

function calcOrderPayable(order: any, items: any[]) {
  const base = order.base_printer_fee_cents || 500;
  const itemsCost = items.reduce(
    (sum, it) => sum + (it.blank_cost_cents_snapshot + it.print_cost_cents_snapshot) * it.qty,
    0
  );
  return base + itemsCost;
}

export async function POST(req: NextRequest) {
  const { orderIds, note } = await req.json();
  const supa = createServiceClient();

  const { data: orders } = await supa.from("orders").select("*").in("id", orderIds);
  const { data: items } = await supa.from("order_items").select("*").in("order_id", orderIds);

  const byOrder = new Map<string, any[]>();
  (items ?? []).forEach((i) => {
    byOrder.set(i.order_id, [...(byOrder.get(i.order_id) ?? []), i]);
  });

  const lines = (orders ?? []).map((o) => {
    const its = byOrder.get(o.id) ?? [];
    const amount = calcOrderPayable(o, its);
    return {
      order_id: o.id,
      amount_cents: amount,
      detail: its.map((x) => ({
        qty: x.qty,
        blank: x.blank_cost_cents_snapshot,
        print: x.print_cost_cents_snapshot
      }))
    };
  });

  const subtotal = lines.reduce((s, l) => s + l.amount_cents, 0);

  const { data: settlement } = await supa
    .from("settlements")
    .insert({
      status: "SENT",
      printer_email: PRINTER_EMAIL,
      subtotal_cents: subtotal,
      total_cents: subtotal,
      notes: note
    })
    .select("*")
    .single();

  const upserts = lines.map((l) => ({
    settlement_id: settlement.id,
    order_id: l.order_id,
    amount_cents: l.amount_cents,
    calc_detail_json: l.detail
  }));
  await supa.from("settlement_orders").upsert(upserts);

  await supa
    .from("orders")
    .update({ printer_payable_status: "BATCHED" })
    .in("id", orderIds);

  await sendPrinterSettlementEmail({
    to: PRINTER_EMAIL,
    subject: `Settlement ${settlement.id} - Total $${(subtotal / 100).toFixed(2)}`,
    html: `
      <h3>Settlement</h3>
      <p>Total: $${(subtotal / 100).toFixed(2)}</p>
      <ul>
        ${lines.map((l) => `<li>Order ${l.order_id}: $${(l.amount_cents / 100).toFixed(2)}</li>`).join("")}
      </ul>
      <p><strong>Actions:</strong></p>
      <p>
        <a href="${process.env.SITE_URL}/api/settlements/${settlement.id}/agree">Agree</a> |
        <a href="${process.env.SITE_URL}/api/settlements/${settlement.id}/needs-updated">Needs updated</a> |
        <a href="${process.env.SITE_URL}/api/settlements/${settlement.id}/paid">Paid in full</a>
      </p>
    `
  });

  return NextResponse.json({ settlementId: settlement.id });
}
