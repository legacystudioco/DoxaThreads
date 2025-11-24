
import { createServiceClient } from "./db";
import { getRates } from "./shippo";
import { prepareItemsForPacking, packItems, formatPackingSummary } from "./packing";

export async function computeCartTotalsAndRate(
  cart: { variantId: string; qty: number }[],
  address?: any
) {
  try {
    console.log("=== COMPUTE CART TOTALS DEBUG ===");
    console.log("Cart items:", cart.length);
    console.log("Address provided:", !!address);
    
    const supa = createServiceClient();

    const ids = cart.map((c) => c.variantId);
    console.log("Looking up variant IDs:", ids);
    
    const { data: variants, error: variantError } = await supa
      .from("variants")
      .select("*, product:products(*)")
      .in("id", ids);

    if (variantError) {
      console.error("Variant lookup error:", variantError);
      throw new Error(`Database error looking up variants: ${variantError.message}`);
    }

    if (!variants || variants.length === 0) {
      throw new Error(`No variants found for IDs: ${ids.join(", ")}`);
    }

    console.log("Found variants:", variants.length);

    // Calculate subtotal
    let subtotal_cents = 0;
    for (const item of cart) {
      const v = variants?.find((v) => v.id === item.variantId);
      if (!v) {
        throw new Error(`Variant not found: ${item.variantId}`);
      }
      subtotal_cents += v.price_cents * item.qty;
    }

    console.log("Subtotal:", subtotal_cents, "cents");

    // Use the new packing algorithm
    console.log("\n📦 Starting packing algorithm...");
    const items = prepareItemsForPacking(cart, variants);
    const packages = packItems(items);
    
    console.log(formatPackingSummary(packages));

    const toAddress = (() => {
      const raw = address || {};
      const mapped = {
        name: raw.name || "Customer",
        street1: raw.street1 || raw.line1 || raw.address1 || "123 St",
        street2: raw.street2 || raw.line2 || raw.address2 || "",
        city: raw.city || raw.locality || "City",
        state: raw.state || raw.state_code || raw.region || "OH",
        zip: raw.zip || raw.postal_code || raw.postcode || "45040",
        country: raw.country || raw.country_code || "US",
        phone: raw.phone || ""
      };
      return mapped;
    })();

    console.log("\n🚀 Getting shipping rates for each package from Shippo...");
    console.log("To Address for Shippo:", JSON.stringify(toAddress, null, 2));

    let totalShippingCents = 0;
    const rateDetails: any[] = [];

    // Get rates for each package
    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      const parcel = {
        length: String(pkg.packageType.length),
        width: String(pkg.packageType.width),
        height: String(pkg.packageType.height),
        distanceUnit: "in" as const,
        weight: String(pkg.totalWeightOz),
        massUnit: "oz" as const
      };

      console.log(`\nPackage ${i + 1}/${packages.length}:`);
      console.log(`  Type: ${pkg.packageType.name}`);
      console.log(`  Weight: ${pkg.totalWeightOz} oz`);
      console.log(`  Dimensions: ${parcel.length}x${parcel.width}x${parcel.height}"`);

      let packageShippingCents = 0;

      try {
        console.log(`  Calling Shippo getRates...`);
        const rates = await getRates({ toAddress, parcel });
        console.log(`  Shippo returned ${rates?.length || 0} rates`);
        
        if (rates && rates.length > 0) {
          // Filter rates based on service type (First Class or Priority)
          let filteredRates = rates;
          if (pkg.packageType.service === 'FIRST_CLASS') {
            // First Class was renamed to Ground Advantage by USPS
            filteredRates = rates.filter(r => {
              const serviceName = (r.servicelevel?.name || r.servicelevelName || '').toLowerCase();
              return serviceName.includes('first') || 
                     serviceName.includes('ground advantage') ||
                     serviceName.includes('ground');
            });
          } else if (pkg.packageType.service === 'PRIORITY') {
            filteredRates = rates.filter(r => {
              const serviceName = (r.servicelevel?.name || r.servicelevelName || '').toLowerCase();
              return serviceName.includes('priority');
            });
          }

          // Fallback to all rates if no filtered rates found
          if (filteredRates.length === 0) {
            console.log(`  ⚠️  No rates matched filter for ${pkg.packageType.service}, using all ${rates.length} rates`);
            filteredRates = rates;
          } else {
            console.log(`  ✅ Filtered to ${filteredRates.length} rates for ${pkg.packageType.service}`);
          }

          const best = filteredRates[0];
          packageShippingCents = Math.round(Number(best.amount) * 100);
          
          console.log(`  ✅ Rate found: $${(packageShippingCents / 100).toFixed(2)}`);
          console.log(`     Carrier: ${best.provider}`);
          console.log(`     Service: ${best.servicelevel?.name || best.servicelevelName}`);

          rateDetails.push({
            packageIndex: i,
            rateId: best.objectId || best.object_id,
            carrier: best.provider,
            service: best.servicelevel?.name || best.servicelevelName,
            amount_cents: packageShippingCents
          });
        } else {
          // Use fallback rates based on service type
          packageShippingCents = pkg.packageType.service === 'FIRST_CLASS' ? 350 : 800;
          console.log(`  ⚠️  No rates returned, using fallback: $${(packageShippingCents / 100).toFixed(2)}`);
          
          rateDetails.push({
            packageIndex: i,
            rateId: 'fallback-rate',
            carrier: 'USPS',
            service: pkg.packageType.service === 'FIRST_CLASS' ? 'First Class Mail' : 'Priority Mail',
            amount_cents: packageShippingCents
          });
        }
      } catch (shippoError: any) {
        console.error(`  ❌ Error getting rate for package ${i + 1}:`, shippoError.message);
        // Use fallback rate
        packageShippingCents = pkg.packageType.service === 'FIRST_CLASS' ? 350 : 800;
        console.log(`  Using fallback rate: $${(packageShippingCents / 100).toFixed(2)}`);
        
        rateDetails.push({
          packageIndex: i,
          rateId: 'fallback-rate',
          carrier: 'USPS',
          service: pkg.packageType.service === 'FIRST_CLASS' ? 'First Class Mail' : 'Priority Mail',
          amount_cents: packageShippingCents
        });
      }

      totalShippingCents += packageShippingCents;
    }

    console.log(`\n💰 Total shipping cost: $${(totalShippingCents / 100).toFixed(2)}`);
    console.log(`   (${packages.length} package${packages.length > 1 ? 's' : ''})`);

    const tax_cents = 0;
    const total_cents = subtotal_cents + totalShippingCents + tax_cents;

    console.log("\nFinal totals:", { 
      subtotal_cents, 
      shipping_cents: totalShippingCents, 
      tax_cents, 
      total_cents 
    });

    // Return the first rate ID for compatibility (or could return all)
    const primaryRate = rateDetails[0] || {
      rateId: 'multi-package-shipment',
      carrier: 'USPS',
      service: 'Multiple Packages'
    };

    return {
      subtotal_cents,
      shipping_cents: totalShippingCents,
      tax_cents,
      total_cents,
      address: toAddress,
      rateId: primaryRate.rateId,
      carrier: primaryRate.carrier,
      service: primaryRate.service,
      variants, // ✅ Return variants so order items can be created
      packages, // ✅ Return packing info for reference
      rateDetails // ✅ Return all rate details
    };
  } catch (error: any) {
    console.error("=== COMPUTE CART TOTALS ERROR ===");
    console.error("Error:", error);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    throw error;
  }
}

export async function snapshotCostsForOrder(orderId: string, supa = createServiceClient()) {
  const { data: items } = await supa
    .from("order_items")
    .select("*, variant:variants(*, product:products(*))")
    .eq("order_id", orderId);

  if (!items) return;

  for (const it of items) {
    const v = it.variant;
    const p = v.product;
    const size = (v.size || "").toUpperCase();

    const blank =
      v.blank_cost_override_cents ??
      (size === "XL" ? p.blank_cost_xl_cents :
       size === "2XL" ? p.blank_cost_2xl_cents :
       size === "3XL" ? p.blank_cost_3xl_cents :
       size === "4XL" ? p.blank_cost_4xl_cents :
       p.blank_cost_l_cents ??
       p.blank_cost_m_cents ??
       p.blank_cost_s_cents ??
       0);

    const print = p.print_cost_cents;

    await supa
      .from("order_items")
      .update({
        blank_cost_cents_snapshot: blank,
        print_cost_cents_snapshot: print
      })
      .eq("id", it.id);
  }
}
