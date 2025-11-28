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

async function notifyShipped(order: OrderRecord) {
  const adminEmail = ADMIN_EMAIL;

  // Customer shipping notification
  const trackingInfo = order.tracking_number
    ? `
      <p><strong>Tracking Number:</strong> ${order.tracking_number}</p>
      <p>You can track your package here:</p>
      <p><a href="https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.tracking_number}">Track Package</a></p>
    `
    : '<p>Your order is on its way! You will receive tracking information soon.</p>';

  await sendCustomerEmail({
    to: order.email,
    subject: "Your DoxaThreads order has shipped! 📦",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your order has shipped!</h2>
        <p>Great news! Your order #${order.id.slice(0, 8)} is on its way to you.</p>
        ${trackingInfo}
        <p>You can view your order details here:</p>
        <p><a href="${siteUrl}/store/orders/${order.id}">${siteUrl}/store/orders/${order.id}</a></p>
        <p>Thank you for your order!</p>
        <p>- The DoxaThreads Team</p>
      </div>
    `,
  });

  // Admin notification
  if (adminEmail) {
    await sendAdminEmail({
      to: adminEmail,
      subject: `📦 Order SHIPPED - #${order.id.slice(0, 8)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Shipped</h2>
          <p>Order #${order.id.slice(0, 8)} has been marked as <strong>SHIPPED</strong>.</p>
          <ul>
            <li><strong>Customer:</strong> ${order.email}</li>
            <li><strong>Tracking:</strong> ${order.tracking_number || 'Not provided'}</li>
          </ul>
        </div>
      `,
    });
  }
}

async function notifyDelivered(order: OrderRecord) {
  const adminEmail = ADMIN_EMAIL;

  // Customer delivery confirmation
  await sendCustomerEmail({
    to: order.email,
    subject: "Your DoxaThreads order was delivered! ✅",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your order has been delivered</h2>
        <p>Order #${order.id.slice(0, 8)} was marked as <strong>DELIVERED</strong>.</p>
        <p>We hope you love your new gear! If you have any issues, please don't hesitate to reach out.</p>
        <p>You can view your order details here:</p>
        <p><a href="${siteUrl}/store/orders/${order.id}">${siteUrl}/store/orders/${order.id}</a></p>
        <p>Thank you for supporting DoxaThreads!</p>
      </div>
    `,
  });

  // Admin notification
  if (adminEmail) {
    await sendAdminEmail({
      to: adminEmail,
      subject: `✅ Order DELIVERED - #${order.id.slice(0, 8)}`,
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

async function notifyCancelled(order: OrderRecord) {
  const adminEmail = ADMIN_EMAIL;

  // Customer cancellation notification
  await sendCustomerEmail({
    to: order.email,
    subject: "Your DoxaThreads order has been cancelled",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Cancelled</h2>
        <p>Order #${order.id.slice(0, 8)} has been <strong>CANCELLED</strong>.</p>
        <p>If you did not request this cancellation or have any questions, please contact us immediately.</p>
        <p>You can view your order details here:</p>
        <p><a href="${siteUrl}/store/orders/${order.id}">${siteUrl}/store/orders/${order.id}</a></p>
      </div>
    `,
  });

  // Admin notification
  if (adminEmail) {
    await sendAdminEmail({
      to: adminEmail,
      subject: `❌ Order CANCELLED - #${order.id.slice(0, 8)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Cancelled</h2>
          <p>Order #${order.id.slice(0, 8)} has been marked as <strong>CANCELLED</strong>.</p>
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .select("*")
    .single();

  if (error || !order) {
    throw new Error(error?.message || "Failed to update order");
  }

  // Send notifications based on status
  if (status === "SHIPPED") {
    await notifyShipped(order as OrderRecord);
  } else if (status === "DELIVERED") {
    await notifyDelivered(order as OrderRecord);
  } else if (status === "CANCELLED") {
    await notifyCancelled(order as OrderRecord);
  }

  return order;
}

export async function POST(req: NextRequest) {
  try {
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
