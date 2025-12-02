import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { computeCartTotalsAndRate } from "@/lib/shipping";
import { createServiceClient } from "@/lib/db";

// Prevent Next.js from trying to statically analyze this route at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // { cart, email?, address?, discount? }
    const DEFAULT_TAX_RATE = 0.0775; // 7.75% fallback until Stripe Tax is wired

    console.log("=== CREATE INTENT DEBUG ===");
    console.log("Cart received:", JSON.stringify(body.cart));
    console.log("Address received:", JSON.stringify(body.address));
    console.log("Discount received:", JSON.stringify(body.discount));
    const shippoToken = (process.env.SHIPPO_API_TOKEN || "").trim();
    console.log(
      "Shippo token present:",
      shippoToken.length > 0,
      "len:",
      shippoToken.length,
      shippoToken ? `mask:${shippoToken.slice(0, 6)}...${shippoToken.slice(-4)}` : ""
    );

    const supa = createServiceClient();

    console.log("Computing cart totals and shipping rate...");
    let {
      subtotal_cents,
      shipping_cents,
      tax_cents,
      total_cents,
      address,
      rateId,
      carrier,
      service,
      variants, // This is returned by computeCartTotalsAndRate
      rateDetails
    } = await computeCartTotalsAndRate(body.cart, body.address);

    // Apply discount if provided
    let discount_cents = 0;
    let discountCode = null;
    if (body.discount) {
      if (body.discount.type === 'percentage') {
        // Percentage discount applies to subtotal only
        discount_cents = Math.round((subtotal_cents * body.discount.value) / 100);
      } else if (body.discount.type === 'fixed') {
        // Fixed discount in cents
        discount_cents = body.discount.value;
      }
      discountCode = body.discount.code;

      // Apply discount to subtotal
      subtotal_cents = Math.max(0, subtotal_cents - discount_cents);

      console.log("Discount applied:", {
        code: discountCode,
        type: body.discount.type,
        value: body.discount.value,
        discount_cents,
        new_subtotal_cents: subtotal_cents
      });
    }

    // Optional: calculate tax via Stripe (tax is calculated on discounted subtotal)
    const fallback_tax_cents = Math.round(subtotal_cents * DEFAULT_TAX_RATE);
    let final_tax_cents = fallback_tax_cents;
    let final_total_cents = subtotal_cents + shipping_cents + final_tax_cents;
    try {
      if (address) {
        const calc = await stripe.tax.calculations.create({
          currency: "usd",
          line_items: [
            {
              amount: subtotal_cents, // Use discounted subtotal for tax calculation
              reference: "merch",
              tax_behavior: "exclusive",
            },
          ],
          shipping_cost: { amount: shipping_cents },
          customer_details: {
            address: {
              line1: address.line1 || address.street1,
              line2: address.line2 || address.street2,
              city: address.city,
              state: address.state,
              postal_code: address.postal_code || address.zip,
              country: address.country || "US",
            },
            address_source: "shipping",
          },
        });

        if (typeof calc.tax_amount_exclusive === "number") {
          final_tax_cents = calc.tax_amount_exclusive;
          final_total_cents = subtotal_cents + shipping_cents + final_tax_cents;
        }
      }
    } catch (taxErr: any) {
      console.error("Stripe tax calculation failed, falling back to default rate:", taxErr?.message);
    }

    console.log("Totals calculated:", { 
      subtotal_cents, 
      shipping_cents, 
      tax_cents: final_tax_cents, 
      total_cents: final_total_cents,
      used_fallback_tax: final_tax_cents === fallback_tax_cents
    });

    console.log("Creating order in database...");
    const orderData: any = {
      email: body.email ?? "unknown@example.com",
      shipping_address: address ?? {},
      subtotal_cents,
      shipping_cents,
      tax_cents: final_tax_cents,
      total_cents: final_total_cents,
      status: "PENDING",
      base_printer_fee_cents: 500
    };

    // Add discount information if present
    if (discountCode) {
      orderData.discount_code = discountCode;
      orderData.discount_cents = discount_cents;
    }

    const { data: order, error: orderError } = await supa
      .from("orders")
      .insert(orderData)
      .select("*")
      .single();

    if (orderError) {
      console.error("Database error:", orderError);
      throw new Error(`Database error: ${orderError.message}`);
    }

    if (!order) {
      throw new Error("Order creation failed - no data returned");
    }

    console.log("Order created:", order.id);

    // ✅ NEW: Create order items
    console.log("Creating order items...");
    const orderItems = body.cart.map((item: any) => {
      const variant = variants?.find((v: any) => v.id === item.variantId);
      if (!variant) {
        throw new Error(`Variant not found: ${item.variantId}`);
      }
      
      const product = variant.product;
      if (!product) {
        throw new Error(`Product not found for variant: ${item.variantId}`);
      }
      
      const size = (variant.size || "").toUpperCase();
      
      // Calculate blank cost based on size
      const blankCost = 
        variant.blank_cost_override_cents ??
        (size === "XL" ? product.blank_cost_xl_cents :
         size === "2XL" ? product.blank_cost_2xl_cents :
         size === "3XL" ? product.blank_cost_3xl_cents :
         size === "4XL" ? product.blank_cost_4xl_cents :
         (product.blank_cost_l_cents || product.blank_cost_m_cents || product.blank_cost_s_cents || 0));
      
      return {
        order_id: order.id,
        variant_id: item.variantId,
        product_title: product.title || "Unknown Product",
        size: variant.size || "N/A",
        qty: item.qty,
        unit_price_cents: variant.price_cents,
        blank_cost_cents_snapshot: blankCost,
        print_cost_cents_snapshot: product.print_cost_cents || 0
      };
    });

    console.log("Order items to create:", orderItems.length);
    
    const { error: itemsError } = await supa
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      // Don't throw - order is already created, but log the issue
      // You may want to handle this differently in production
    } else {
      console.log("Order items created successfully");
    }

    console.log("Creating Stripe payment intent...");
    const paymentIntentMetadata: any = {
      order_id: order.id,
      rate_id: rateId,
      carrier,
      service,
      rate_ids_json: rateDetails ? JSON.stringify(rateDetails) : undefined,
      order_id_for_redirect: order.id
    };

    // Add discount to metadata if present
    if (discountCode) {
      paymentIntentMetadata.discount_code = discountCode;
      paymentIntentMetadata.discount_cents = discount_cents.toString();
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: final_total_cents,
      currency: "usd",
      // Limit to card to avoid Link/hCaptcha/alt methods issues
      payment_method_types: ["card"],
      metadata: paymentIntentMetadata
    });

    console.log("Payment intent created:", paymentIntent.id);

    await supa
      .from("orders")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", order.id);

    // Increment discount code usage count if discount was applied
    if (discountCode) {
      await supa.rpc('increment_discount_usage', { code_text: discountCode });
    }

    console.log("Success! Returning client secret with totals");
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      totals: {
        subtotal_cents,
        shipping_cents,
        tax_cents: final_tax_cents,
        total_cents: final_total_cents,
        discount_cents: discount_cents || 0
      }
    });
    
  } catch (error: any) {
    console.error("=== CREATE INTENT ERROR ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to create payment intent",
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
