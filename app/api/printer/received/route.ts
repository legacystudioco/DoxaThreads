import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { sendAdminEmail } from "@/lib/email";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "modifiedskin@gmail.com";

function assertAuthorized(req: NextRequest) {
  const secret = process.env.PRINTER_WEBHOOK_SECRET;
  if (!secret) return;
  const url = new URL(req.url);
  const token = req.headers.get("x-printer-secret") || url.searchParams.get("token");
  if (token !== secret) {
    throw new Error("Unauthorized");
  }
}

export async function POST(req: NextRequest) {
  try {
    assertAuthorized(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await req.json();
  const supa = createServiceClient();

  await supa
    .from("orders")
    .update({ status: "RECEIVED_BY_PRINTER" })
    .eq("id", orderId);

  await sendAdminEmail({
    to: ADMIN_EMAIL,
    subject: `📦 Order received by printer #${String(orderId).slice(0, 8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Printer Received Order</h2>
        <p>The printer has marked the following order as <strong>Received</strong>.</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
      </div>
    `
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  try {
    assertAuthorized(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const supa = createServiceClient();

  await supa
    .from("orders")
    .update({ status: "RECEIVED_BY_PRINTER" })
    .eq("id", orderId);

  await sendAdminEmail({
    to: ADMIN_EMAIL,
    subject: `📦 Order received by printer #${String(orderId).slice(0, 8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Printer Received Order</h2>
        <p>The printer has marked the following order as <strong>Received</strong>.</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
      </div>
    `
  });

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || "https://doxathreads.com"}/printer/success`);
}
