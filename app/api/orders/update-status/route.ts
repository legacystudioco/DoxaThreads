import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { sendCustomerEmail, sendAdminEmail } from "@/lib/email";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://doxathreads.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "modifiedskin@gmail.com";

type OrderRecord = {
  id: string;
  email: string;
  status: string;
  tracking_number?: string | null;
};

function assertAuthorized(req: NextRequest) {
  const secret = process.env.PRINTER_WEBHOOK_SECRET;
  if (!secret) return; // If no secret set, leave behavior unchanged

  const url = new URL(req.url);
  const token = req.headers.get("x-printer-secret") || url.searchParams.get("token");
  if (token !== secret) {
    throw new Error("Unauthorized");
  }
}

async function notifyDelivered(order: OrderRecord) {
  const adminEmail = ADMIN_EMAIL;

  // Customer delivery confirmation
  await sendCustomerEmail({
    to: order.email,
    subject: "Your order was delivered",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your order has been delivered</h2>
        <p>Order #${order.id.slice(0, 8)} was marked as <strong>DELIVERED</strong>.</p>
        <p>You can view your order details here:</p>
        <p><a href="${siteUrl}/store/orders/${order.id}">${siteUrl}/store/orders/${order.id}</a></p>
      </div>
    `,
  });

  // Admin notification (optional)
  if (adminEmail) {
    await sendAdminEmail({
      to: adminEmail,
      subject: `📦 Order DELIVERED - #${order.id.slice(0, 8)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Delivered</h2>
          <p>Order #${order.id.slice(0, 8)} has been marked as <strong>DELIVERED</strong>.</p>
          <ul>
            <li><strong>Customer:</strong> ${order.email}</li>
          </ul>
        </div>
      `,
    });
  }
}

async function handleStatusChange(status: string, orderId: string) {
  const supa = createServiceClient();

  const { data: order, error } = await supa
  .from("orders")
  .update({
  status,
  })
  .eq("id", orderId)
  .select("*")
  .single();

  if (error || !order) {
    throw new Error(error?.message || "Failed to update order");
  }

  if (status === "DELIVERED") {
    await notifyDelivered(order as OrderRecord);
  }

  return order;
}

export async function POST(req: NextRequest) {
  try {
    assertAuthorized(req);

    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "orderId and status are required" },
        { status: 400 }
      );
    }

    const order = await handleStatusChange(status, orderId);

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    const isUnauthorized = (error as Error)?.message === "Unauthorized";
    return NextResponse.json(
      { error: isUnauthorized ? "Unauthorized" : "Internal server error" },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}

// Support GET so printer/admin email buttons can be simple links
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const status = searchParams.get("status") || "DELIVERED";

  try {
    assertAuthorized(req);
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!orderId) {
    return NextResponse.json(
      { error: "Missing orderId" },
      { status: 400 }
    );
  }

  try {
    await handleStatusChange(status, orderId);
    return NextResponse.redirect(`${siteUrl}/printer/success`);
  } catch (error) {
    console.error("Error updating order status (GET):", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
