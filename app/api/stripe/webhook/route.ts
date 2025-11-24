import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/db";
import { purchaseLabel } from "@/lib/shippo";
import { sendCustomerEmail, sendPrinterOrderEmail, sendAdminEmail } from "@/lib/email";
import { snapshotCostsForOrder } from "@/lib/shipping";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PRINTER_EMAIL = process.env.PRINTER_EMAIL || "orders@sticknstitch.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "modifiedskin@gmail.com";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = headers().get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as any;
    const orderId = pi.metadata?.order_id;
    let rateId = pi.metadata?.rate_id;
    let rateDetails: any[] = [];
    if (pi.metadata?.rate_ids_json) {
      try {
        rateDetails = JSON.parse(pi.metadata.rate_ids_json);
      } catch (err) {
        console.error("Failed to parse rate_ids_json", err);
      }
    }
    const tokenQuery = process.env.PRINTER_WEBHOOK_SECRET ? `&token=${process.env.PRINTER_WEBHOOK_SECRET}` : "";

    console.log("=== PAYMENT SUCCESS WEBHOOK ===");
    console.log("Order ID:", orderId);
    console.log("Rate ID:", rateId);

    const supa = createServiceClient();
    
    // Get order with items
    const { data: order } = await supa
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();
      
    if (!order) {
      console.error("Order not found:", orderId);
      return NextResponse.json({ ok: true });
    }

    console.log("Order found, updating status to PAID");
    await supa.from("orders").update({ status: "PAID" }).eq("id", order.id);
    
    console.log("Snapshotting costs for order items");
    await snapshotCostsForOrder(order.id, supa);

    if (Array.isArray(rateDetails) && rateDetails.length > 1) {
      console.log("Multiple packages detected; skipping auto label purchase");
      if (ADMIN_EMAIL) {
        await sendAdminEmail({
          to: ADMIN_EMAIL,
          subject: `⚠️ Multi-package order needs labels #${order.id.slice(0, 8)}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Manual label purchase required</h2>
              <p>Order #${order.id} has multiple packages and needs manual label creation.</p>
              <ul>
                ${rateDetails.map((r, idx) => `<li>Package ${idx + 1}: $${(r.amount_cents/100).toFixed(2)} - ${r.carrier} ${r.service} (rateId: ${r.rateId})</li>`).join("")}
              </ul>
            </div>
          `
        });
      }
      await supa.from("orders").update({ label_status: "MANUAL_REQUIRED" }).eq("id", order.id);
      return NextResponse.json({ ok: true, message: "Payment processed; manual label required" });
    }

    if (!rateId || rateId === "fallback-rate") {
      console.error("Missing or fallback rateId; attempting to get fresh rate");
      
      // Try to get a fresh rate from Shippo
      try {
        const { getRates } = await import("@/lib/shippo");
        const { prepareItemsForPacking, packItems } = await import("@/lib/packing");
        
        // Get order items to calculate package
        const { data: orderItems } = await supa
          .from("order_items")
          .select("*, variant:variants(*, product:products(*))")
          .eq("order_id", order.id);
        
        if (orderItems && orderItems.length > 0 && order.shipping_address) {
          console.log("Attempting to get fresh Shippo rate...");
          
          // Build cart-like structure from order items
          const cart = orderItems.map(item => ({
            variantId: item.variant_id,
            qty: item.qty
          }));
          
          // Get variants
          const variants = orderItems.map(item => item.variant);
          
          // Pack items
          const items = prepareItemsForPacking(cart, variants);
          const packages = packItems(items);
          
          if (packages.length === 1) {
            const pkg = packages[0];
            const parcel = {
              length: String(pkg.packageType.length),
              width: String(pkg.packageType.width),
              height: String(pkg.packageType.height),
              distanceUnit: "in" as const,
              weight: String(pkg.totalWeightOz),
              massUnit: "oz" as const
            };
            
            const toAddress = {
              name: order.shipping_address.name || "Customer",
              street1: order.shipping_address.street1 || order.shipping_address.line1,
              street2: order.shipping_address.street2 || order.shipping_address.line2 || "",
              city: order.shipping_address.city,
              state: order.shipping_address.state,
              zip: order.shipping_address.zip || order.shipping_address.postal_code,
              country: order.shipping_address.country || "US",
              phone: order.shipping_address.phone || ""
            };
            
            const rates = await getRates({ toAddress, parcel });
            
            if (rates && rates.length > 0) {
              rateId = rates[0].objectId || rates[0].object_id;
              console.log("✅ Got fresh rate from Shippo:", rateId);
            } else {
              console.error("❌ Still no rates from Shippo");
            }
          } else {
            console.error("Multiple packages - cannot auto-retry");
          }
        }
      } catch (retryError: any) {
        console.error("Failed to get fresh rate:", retryError.message);
      }
      
      // If still no valid rate, notify admin
      if (!rateId || rateId === "fallback-rate") {
        if (ADMIN_EMAIL) {
          await sendAdminEmail({
            to: ADMIN_EMAIL,
            subject: `⚠️ Label not purchased for order #${order.id.slice(0, 8)}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Manual label required</h2>
                <p>Order #${order.id} was paid but no valid Shippo rate was available.</p>
                <ul>
                  <li><strong>Customer:</strong> ${order.email}</li>
                  <li><strong>Status:</strong> ${order.status}</li>
                  <li><strong>Stored rateId:</strong> ${rateId || "none"}</li>
                </ul>
                <p><strong>Action needed:</strong> Create label manually in Shippo dashboard.</p>
              </div>
            `
          });
        }
        await supa.from("orders").update({ label_status: "MANUAL_REQUIRED" }).eq("id", order.id);
        return NextResponse.json({ ok: true, message: "Payment processed; label not purchased" });
      }
    }

    console.log("Purchasing shipping label from Shippo");
    const label = await purchaseLabel({ rateId });
    
    console.log("Updating order with shipping info");
    await supa
      .from("orders")
      .update({
        status: "LABEL_PURCHASED",
        shippo_transaction_id: label.transaction_id,
        label_url: label.label_url,
        tracking_number: label.tracking_number,
        carrier: label.carrier,
        service: label.service
      })
      .eq("id", order.id);

    // ✅ Fetch order items for email
    console.log("Fetching order items for email");
    const { data: orderItems } = await supa
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    console.log("Order items found:", orderItems?.length || 0);

    console.log("Sending customer confirmation email");
    await sendCustomerEmail({
      to: order.email,
      subject: "Order Confirmed - DOXA Threads",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #000;">Order Confirmed!</h2>
          <p>Thank you for your order. We've received your payment and will begin production shortly.</p>
          
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border: 2px solid #000;">
            <h3 style="margin-top: 0;">Order #${order.id.slice(0, 8)}</h3>
            
            <h4>Items Ordered:</h4>
            ${orderItems && orderItems.length > 0 ? `
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #000;">
                    <th style="text-align: left; padding: 8px;">Product</th>
                    <th style="text-align: center; padding: 8px;">Size</th>
                    <th style="text-align: center; padding: 8px;">Qty</th>
                    <th style="text-align: right; padding: 8px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItems.map(item => `
                    <tr style="border-bottom: 1px solid #ddd;">
                      <td style="padding: 8px;">${item.product_title}</td>
                      <td style="text-align: center; padding: 8px;">${item.size}</td>
                      <td style="text-align: center; padding: 8px;">${item.qty}</td>
                      <td style="text-align: right; padding: 8px;">$${(item.unit_price_cents * item.qty / 100).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p>No items found</p>'}
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #000;">
              <table style="width: 100%;">
                <tr>
                  <td style="text-align: right; padding: 4px;"><strong>Subtotal:</strong></td>
                  <td style="text-align: right; padding: 4px;">$${(order.subtotal_cents / 100).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="text-align: right; padding: 4px;"><strong>Shipping:</strong></td>
                  <td style="text-align: right; padding: 4px;">$${(order.shipping_cents / 100).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="text-align: right; padding: 4px;"><strong>Tax:</strong></td>
                  <td style="text-align: right; padding: 4px;">$${(order.tax_cents / 100).toFixed(2)}</td>
                </tr>
                <tr style="border-top: 2px solid #000;">
                  <td style="text-align: right; padding: 8px;"><strong>Total:</strong></td>
                  <td style="text-align: right; padding: 8px;"><strong>$${(order.total_cents / 100).toFixed(2)}</strong></td>
                </tr>
              </table>
            </div>
          </div>
          
          <h3>What Happens Next?</h3>
          <ol>
            <li><strong>Production (7-10 business days):</strong> Your items will be printed on demand using high-quality materials.</li>
            <li><strong>Shipping:</strong> Once shipped, you'll receive tracking information via email.</li>
            <li><strong>Delivery:</strong> Your order arrives at your doorstep.</li>
          </ol>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
            Questions? Contact us at support@doxathreads.com<br>
            Order ID: ${order.id}
          </p>
        </div>
      `
    });

    console.log("Sending printer order notification");
    await sendPrinterOrderEmail({
      to: PRINTER_EMAIL,
      subject: `🖨️ NEW ORDER #${order.id.slice(0, 8)} - PRINT & SHIP`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <div style="background: #000; color: #fff; padding: 20px; margin-bottom: 20px;">
            <h1 style="margin: 0;">🖨️ NEW PRINT ORDER</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Order #${order.id.slice(0, 8)}</p>
          </div>
          
          <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin-bottom: 20px;">
            <strong>⚡ ACTION REQUIRED:</strong> Print items below, pack, and ship using the label.
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; margin-bottom: 20px; border: 2px solid #000;">
            <h2 style="margin-top: 0;">📦 Items to Print & Pack</h2>
            ${orderItems && orderItems.length > 0 ? `
              <table style="width: 100%; border-collapse: collapse; background: white;">
                <thead>
                  <tr style="background: #000; color: #fff;">
                    <th style="text-align: left; padding: 12px; border: 1px solid #000;">Product</th>
                    <th style="text-align: center; padding: 12px; border: 1px solid #000;">Size</th>
                    <th style="text-align: center; padding: 12px; border: 1px solid #000;">Quantity</th>
                    <th style="text-align: right; padding: 12px; border: 1px solid #000;">Your Cost</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItems.map(item => `
                    <tr>
                      <td style="padding: 12px; border: 1px solid #ddd;"><strong>${item.product_title}</strong></td>
                      <td style="text-align: center; padding: 12px; border: 1px solid #ddd; font-size: 18px;"><strong>${item.size}</strong></td>
                      <td style="text-align: center; padding: 12px; border: 1px solid #ddd; font-size: 18px;"><strong>${item.qty}</strong></td>
                      <td style="text-align: right; padding: 12px; border: 1px solid #ddd;">
                        Blank: $${(item.blank_cost_cents_snapshot / 100).toFixed(2)}<br>
                        Print: $${(item.print_cost_cents_snapshot / 100).toFixed(2)}<br>
                        <strong>Total: $${((item.blank_cost_cents_snapshot + item.print_cost_cents_snapshot) * item.qty / 100).toFixed(2)}</strong>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-left: 4px solid #0066cc;">
                <strong>💰 Your Total Cost for this Order:</strong><br>
                ${orderItems.reduce((sum, item) => sum + ((item.blank_cost_cents_snapshot + item.print_cost_cents_snapshot) * item.qty), 0) / 100} 
                (${orderItems.reduce((sum, item) => sum + item.qty, 0)} items × costs) + $5.00 base fee = 
                <strong>$${((orderItems.reduce((sum, item) => sum + ((item.blank_cost_cents_snapshot + item.print_cost_cents_snapshot) * item.qty), 0) / 100) + 5).toFixed(2)}</strong>
              </div>
            ` : '<p style="color: red;"><strong>⚠️ WARNING: No order items found! Check database.</strong></p>'}
          </div>
          
          <div style="background: #d4edda; border: 2px solid #28a745; padding: 20px; margin-bottom: 20px;">
            <h2 style="margin-top: 0;">🚚 Shipping Information</h2>
            
            <p style="margin: 10px 0;">
              <strong>📄 Shipping Label:</strong><br>
              <a href="${label.label_url}" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; margin-top: 5px;">
                📥 DOWNLOAD SHIPPING LABEL (PDF)
              </a>
            </p>
            
            <p style="margin: 10px 0;">
              <strong>📍 Tracking Number:</strong> ${label.tracking_number || 'N/A'}<br>
              <strong>📦 Carrier:</strong> ${label.carrier || 'N/A'}<br>
              <strong>🚛 Service:</strong> ${label.service || 'N/A'}
            </p>
            
            <p style="margin: 10px 0;">
              <strong>📬 Ship To:</strong><br>
              <pre style="background: white; padding: 10px; border: 1px solid #ddd;">${JSON.stringify(order.shipping_address, null, 2)}</pre>
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border: 1px solid #ddd;">
            <h3 style="margin-top: 0;">✅ Fulfillment Checklist</h3>
            <ul style="list-style: none; padding: 0;">
              <li>☐ Print all items listed above in correct sizes</li>
              <li>☐ Quality check each print</li>
              <li>☐ Fold and pack items carefully</li>
              <li>☐ Print shipping label (link above)</li>
              <li>☐ Attach label to poly mailer</li>
              <li>☐ Drop off at ${label.carrier || 'carrier'}</li>
              <li>☐ Mark order as shipped in system (if available)</li>
            </ul>
          </div>

          <div style="margin-top: 30px; padding: 20px; border-top: 2px solid #000;">
            <h3 style="margin-top: 0;">📮 Order Status Actions</h3>
            <p>Click a button below to update the order status:</p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://doxathreads.com"}/api/printer/received?orderId=${order.id}${tokenQuery}"
               style="display: inline-block; background: #ffc107; color: #000; padding: 10px 20px; text-decoration: none; margin-right: 10px; font-weight: bold;">
              ✅ Mark as Received
            </a>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://doxathreads.com"}/api/printer/shipped?orderId=${order.id}${tokenQuery}"
               style="display: inline-block; background: #28a745; color: #fff; padding: 10px 20px; text-decoration: none; font-weight: bold;">
              🚚 Mark as Completed / Shipped
            </a>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd; color: #666; font-size: 14px;">
            <p><strong>Order Details:</strong></p>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Order ID:</strong> ${order.id}</li>
              <li><strong>Customer Email:</strong> ${order.email}</li>
              <li><strong>Order Total:</strong> $${(order.total_cents / 100).toFixed(2)}</li>
              <li><strong>Customer Paid Shipping:</strong> $${(order.shipping_cents / 100).toFixed(2)}</li>
            </ul>
          </div>
        </div>
      `
    });

    // Notify admin that an order has been placed
    console.log("Sending admin order notification");
    await sendAdminEmail({
      to: ADMIN_EMAIL,
      subject: `🛒 New Order Placed - #${order.id.slice(0, 8)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Order Received</h2>
          <p>A new order has been placed and sent to the printer.</p>
          <ul>
            <li><strong>Order ID:</strong> ${order.id}</li>
            <li><strong>Customer:</strong> ${order.email}</li>
            <li><strong>Total:</strong> $${(order.total_cents / 100).toFixed(2)}</li>
            <li><strong>Tracking:</strong> ${label.tracking_number || 'Pending'}</li>
          </ul>
        </div>
      `
    });

    console.log("Webhook processing complete");
  }

  return NextResponse.json({ received: true });
}
