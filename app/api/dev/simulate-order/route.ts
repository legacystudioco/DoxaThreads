import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { sendCustomerEmail, sendPrinterOrderEmail, sendAdminEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Dev-only endpoint to simulate a full order without Stripe/Shippo.
 * - Creates a fake order + one item in Supabase
 * - Adds a dummy label URL + tracking
 * - Sends the same emails (customer, printer, admin)
 * - Printer email includes the action buttons that hit /api/printer/received and /api/printer/shipped
 *
 * Call with GET:
 *   /api/dev/simulate-order?email=test@example.com
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerEmail = searchParams.get("email") || "customer@example.com";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://doxathreads.com";
    const tokenQuery = process.env.PRINTER_WEBHOOK_SECRET ? `&token=${process.env.PRINTER_WEBHOOK_SECRET}` : "";
    const orderStatusUrl = (id: string) => `${siteUrl}/store/orders/${id}`;
    const receivedUrl = (id: string) => `${siteUrl}/api/printer/received?orderId=${id}${tokenQuery}`;
    const shippedUrl = (id: string) => `${siteUrl}/api/printer/shipped?orderId=${id}${tokenQuery}`;

    const supa = createServiceClient();

    // 1) Create a fake order
    const fakeShippingAddress = {
      name: "Test Customer",
      address_line1: "123 Test St",
      address_line2: "",
      city: "Austin",
      state: "TX",
      zip: "78701",
      country: "US",
      phone: "555-1212",
    };

    const dummyLabelUrl = "https://example.com/fake-label.pdf";
    const dummyTracking = "TEST123456789US";

    const { data: order, error: orderErr } = await supa
      .from("orders")
      .insert({
        email: customerEmail,
        status: "PAID",
        shipping_address: fakeShippingAddress, // JSONB
        subtotal_cents: 1000,
        shipping_cents: 500,
        tax_cents: 0,
        total_cents: 1500,
        shipping_label_url: dummyLabelUrl,
        tracking_number: dummyTracking,
        carrier: "USPS"
      })
      .select("*")
      .single();

    if (orderErr || !order) {
      console.error("Failed to create order:", {
        message: orderErr?.message,
        details: orderErr?.details,
        hint: orderErr?.hint,
        code: orderErr?.code,
      });
      return NextResponse.json(
        {
          error: "Failed to create fake order",
          supabase: {
            message: orderErr?.message,
            details: orderErr?.details,
            hint: orderErr?.hint,
            code: orderErr?.code,
          }
        },
        { status: 500 }
      );
    }

    {
      const { error: oiErr } = await supa.from("order_items").insert({
        order_id: order.id,
        product_title: "DEV TEST T-Shirt",
        size: "L",
        qty: 1,
        unit_price_cents: 1000,
        blank_cost_cents_snapshot: 400,
        print_cost_cents_snapshot: 250,
      });
      if (oiErr) {
        console.error("Failed to create order item:", {
          message: oiErr.message,
          details: oiErr.details,
          hint: oiErr.hint,
          code: oiErr.code,
        });
        return NextResponse.json(
          {
            error: "Failed to create order item",
            supabase: {
              message: oiErr.message,
              details: oiErr.details,
              hint: oiErr.hint,
              code: oiErr.code,
            }
          },
          { status: 500 }
        );
      }
    }

    // 3) Send customer confirmation (simple)
    await sendCustomerEmail({
      to: order.email,
      subject: `Order confirmed #${order.id.slice(0, 8)} (DEV)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Confirmed (DEV)</h2>
          <p>Thanks! We've received your order. This is a development simulation.</p>
          <p><strong>Order:</strong> ${order.id}</p>
          <p><strong>Total:</strong> $${(order.total_cents / 100).toFixed(2)}</p>
          <p>You can view your order status here:</p>
          <p><a href="${orderStatusUrl(order.id)}">${orderStatusUrl(order.id)}</a></p>
        </div>
      `,
      text: [
        `Order Confirmed (DEV)`,
        `Order: ${order.id}`,
        `Total: $${(order.total_cents / 100).toFixed(2)}`,
        `Status: ${orderStatusUrl(order.id)}`
      ].join("\n")
    });

    // 4) Send printer email with action buttons (uses the new GET routes)
    await sendPrinterOrderEmail({
      to: process.env.PRINTER_EMAIL || "orders@sticknstitch.com",
      subject: `🖨️ NEW ORDER #${order.id.slice(0, 8)} - PRINT & SHIP (DEV)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <div style="background: #000; color: #fff; padding: 20px; margin-bottom: 20px;">
            <h1 style="margin: 0;">🖨️ NEW PRINT ORDER (DEV)</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Order #${order.id.slice(0, 8)}</p>
          </div>

          <div style="background: #f5f5f5; padding: 20px; margin-bottom: 20px; border: 2px solid #000;">
            <h3 style="margin-top: 0;">Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #000;">
                  <th style="text-align: left; padding: 8px;">Product</th>
                  <th style="text-align: center; padding: 8px;">Size</th>
                  <th style="text-align: center; padding: 8px;">Qty</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 8px;">DEV TEST T-Shirt</td>
                  <td style="padding: 8px; text-align: center;">L</td>
                  <td style="padding: 8px; text-align: center;">1</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="background: #d4edda; border: 2px solid #28a745; padding: 20px; margin-bottom: 20px;">
            <h2 style="margin-top: 0;">🚚 Shipping Information</h2>
            <p style="margin: 10px 0;">
              <strong>📄 Shipping Label:</strong><br>
              <a href="${dummyLabelUrl}" style="display: inline-block; background: #28a745; color: #fff; padding: 10px 20px; text-decoration: none; margin-top: 5px;">
                📥 DOWNLOAD SHIPPING LABEL (PDF)
              </a>
            </p>
            <p style="margin: 10px 0;">
              <strong>📍 Tracking Number:</strong> ${dummyTracking}<br>
              <strong>📬 Ship To:</strong><br>
              <pre style="background: white; padding: 10px; border: 1px solid #ddd;">${JSON.stringify(order.shipping_address, null, 2)}</pre>
            </p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border: 1px solid #ddd;">
            <h3 style="margin-top: 0;">✅ Fulfillment Checklist</h3>
            <ul style="list-style: none; padding: 0;">
              <li>☐ Print items</li>
              <li>☐ Quality check</li>
              <li>☐ Pack carefully</li>
              <li>☐ Attach label</li>
              <li>☐ Drop off</li>
            </ul>
          </div>

          <div style="margin-top: 30px; padding: 20px; border-top: 2px solid #000;">
            <h3 style="margin-top: 0;">📮 Order Status Actions</h3>
            <p>Click a button below to update the order status:</p>
            <a href="${receivedUrl(order.id)}"
               style="display: inline-block; background: #ffc107; color: #000; padding: 10px 20px; text-decoration: none; margin-right: 10px; font-weight: bold;">
              ✅ Mark as Received
            </a>
            <a href="${shippedUrl(order.id)}"
               style="display: inline-block; background: #28a745; color: #fff; padding: 10px 20px; text-decoration: none; font-weight: bold;">
              🚚 Mark as Completed / Shipped
            </a>
          </div>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd; color: #666; font-size: 14px;">
            <p><strong>Order Details:</strong></p>
            <ul style="margin: 0; padding-left: 16px;">
              <li><strong>Order ID:</strong> ${order.id}</li>
              <li><strong>Customer Email:</strong> ${order.email}</li>
              <li><strong>Order Total:</strong> $${(order.total_cents / 100).toFixed(2)}</li>
              <li><strong>Customer Paid Shipping:</strong> $${(order.shipping_cents / 100).toFixed(2)}</li>
            </ul>
          </div>
        </div>
      `,
      text: [
        `NEW PRINT ORDER (DEV)`,
        `Order ID: ${order.id}`,
        `Label: ${dummyLabelUrl}`,
        `Tracking: ${dummyTracking}`,
        `Mark as received: ${receivedUrl(order.id)}`,
        `Mark as shipped: ${shippedUrl(order.id)}`
      ].join("\n")
    });

    // 5) Notify admin
    await sendAdminEmail({
      to: process.env.ADMIN_EMAIL || "modifiedskin@gmail.com",
      subject: `🛒 New Order Placed - #${order.id.slice(0, 8)} (DEV)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Order (DEV)</h2>
          <ul>
            <li><strong>Order ID:</strong> ${order.id}</li>
            <li><strong>Customer:</strong> ${order.email}</li>
            <li><strong>Total:</strong> $${(order.total_cents / 100).toFixed(2)}</li>
            <li><strong>Tracking:</strong> ${dummyTracking}</li>
          </ul>
        </div>
      `,
      text: [
        `New Order (DEV)`,
        `Order ID: ${order.id}`,
        `Customer: ${order.email}`,
        `Total: $${(order.total_cents / 100).toFixed(2)}`,
        `Tracking: ${dummyTracking}`,
        `Mark as received: ${receivedUrl(order.id)}`,
        `Mark as shipped: ${shippedUrl(order.id)}`
      ].join("\n")
    });

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (error: any) {
    console.error("DEV simulate-order error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
