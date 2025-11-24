import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { sendCustomerEmail, sendAdminEmail } from "@/lib/email";

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

  const { data: order } = await supa
    .from("orders")
    .update({ status: "SHIPPED" })
    .eq("id", orderId)
    .select("*")
    .single();

  if (order?.tracking_number) {
    await sendCustomerEmail({
      to: order.email,
      subject: "Your order has shipped",
      html: `Tracking: ${order.tracking_number}`
    });

    await sendAdminEmail({
      to: ADMIN_EMAIL,
      subject: `✅ Order completed (shipped) #${String(orderId).slice(0, 8)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Completed / Shipped</h2>
          <p>The printer has marked this order as <strong>Completed / Shipped</strong>.</p>
          <ul>
            <li><strong>Order ID:</strong> ${orderId}</li>
            <li><strong>Customer:</strong> ${order?.email}</li>
            <li><strong>Tracking:</strong> ${order?.tracking_number || "N/A"}</li>
          </ul>
        </div>
      `
    });
  }

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

  const { data: order } = await supa
    .from("orders")
    .update({ status: "SHIPPED" })
    .eq("id", orderId)
    .select("*")
    .single();

  if (order?.tracking_number) {
    await sendCustomerEmail({
      to: order.email,
      subject: "Your order has shipped",
      html: `Tracking: ${order.tracking_number}`
    });

    await sendAdminEmail({
      to: ADMIN_EMAIL,
      subject: `✅ Order completed (shipped) #${String(orderId).slice(0, 8)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Completed / Shipped</h2>
          <p>The printer has marked this order as <strong>Completed / Shipped</strong>.</p>
          <ul>
            <li><strong>Order ID:</strong> ${orderId}</li>
            <li><strong>Customer:</strong> ${order?.email}</li>
            <li><strong>Tracking:</strong> ${order?.tracking_number || "N/A"}</li>
          </ul>
        </div>
      `
    });
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || "https://doxathreads.com"}/printer/success`);
}
