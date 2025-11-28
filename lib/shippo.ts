const SHIPPO_ENDPOINT = "https://api.goshippo.com";

function getShippoToken() {
  const token = (process.env.SHIPPO_API_TOKEN || "").trim();
  if (!token) {
    throw new Error("SHIPPO_API_TOKEN environment variable is not set");
  }
  const masked = token.length > 10 ? `${token.substring(0, 8)}...${token.slice(-4)}` : "[short token]";
  console.log("Using Shippo token:", masked);
  return token;
}

async function shippoRequest(path: string, body: any) {
  const token = getShippoToken();
  const res = await fetch(`${SHIPPO_ENDPOINT}${path}`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    console.error("Shippo API error", res.status, res.statusText, data);
    throw new Error(
      `Shippo API error ${res.status}: ${res.statusText} - ${JSON.stringify(data)}`
    );
  }

  return data;
}

export async function getRates({ toAddress, parcel }: any) {
  console.log("=== SHIPPO GET RATES DEBUG ===");

  const FROM = {
    name: process.env.SHIP_FROM_NAME || "Sender",
    street1: process.env.SHIP_FROM_STREET_1 || "123 Main St",
    street2: process.env.SHIP_FROM_STREET_2 || "",
    city: process.env.SHIP_FROM_CITY || "Mason",
    state: process.env.SHIP_FROM_STATE || "OH",
    zip: process.env.SHIP_FROM_ZIP || "45040",
    country: "US",
    phone: process.env.SHIP_FROM_PHONE || ""
  };

  console.log("=== FROM ADDRESS CHECK ===");
  console.log("From address:", FROM);
  console.log("ENV SHIP_FROM_CITY:", process.env.SHIP_FROM_CITY);
  console.log("ENV SHIP_FROM_STATE:", process.env.SHIP_FROM_STATE);
  console.log("ENV SHIP_FROM_ZIP:", process.env.SHIP_FROM_ZIP);
  console.log("");
  
  console.log("To address:", toAddress);
  console.log("Parcel:", parcel);

  // Validate required address fields
  console.log("Validating address fields:", {
    has_street1: !!toAddress.street1,
    has_city: !!toAddress.city,
    has_state: !!toAddress.state,
    has_zip: !!toAddress.zip,
    street1: toAddress.street1,
    city: toAddress.city,
    state: toAddress.state,
    zip: toAddress.zip
  });
  
  if (!toAddress.street1 || !toAddress.city || !toAddress.state || !toAddress.zip) {
    console.error("❌ Invalid to address - missing required fields");
    console.error("Full address object:", JSON.stringify(toAddress, null, 2));
    throw new Error("Invalid shipping address - missing required fields");
  }

  console.log("Validating parcel:", {
    weight: parcel.weight,
    weight_number: Number(parcel.weight),
    is_valid: parcel.weight && Number(parcel.weight) > 0
  });
  
  if (!parcel.weight || Number(parcel.weight) <= 0) {
    console.error("❌ Invalid parcel weight:", parcel.weight);
    console.error("Full parcel object:", JSON.stringify(parcel, null, 2));
    throw new Error("Invalid parcel weight");
  }

  try {
    // Normalize parcel fields to Shippo schema
    const normalizedParcel = {
      length: parcel.length || parcel.length?.toString(),
      width: parcel.width || parcel.width?.toString(),
      height: parcel.height || parcel.height?.toString(),
      distance_unit: parcel.distance_unit || parcel.distanceUnit || "in",
      weight: parcel.weight || parcel.weight?.toString() || parcel.mass?.toString(),
      mass_unit: parcel.mass_unit || parcel.massUnit || "oz",
    };

    console.log("Creating shipment via REST...");
    
    // Build carrier accounts array from env variables
    const carrierAccounts = [];
    if (process.env.SHIPPO_USPS_ACCOUNT_ID) {
      carrierAccounts.push(process.env.SHIPPO_USPS_ACCOUNT_ID);
      console.log("✅ Using USPS account:", process.env.SHIPPO_USPS_ACCOUNT_ID);
    }
    // Temporarily disable UPS to test if USPS works alone
    // if (process.env.SHIPPO_UPS_ACCOUNT_ID) {
    //   carrierAccounts.push(process.env.SHIPPO_UPS_ACCOUNT_ID);
    //   console.log("✅ Using UPS account:", process.env.SHIPPO_UPS_ACCOUNT_ID);
    // }
    console.log("⚠️  UPS temporarily disabled for testing - using USPS only");
    
    const requestBody: any = {
      address_from: FROM,
      address_to: toAddress,
      parcels: [normalizedParcel],
      async: false
    };
    
    // Only specify carrier accounts if we have them configured
    if (carrierAccounts.length > 0) {
      requestBody.carrier_accounts = carrierAccounts;
      console.log("📌 Limiting to specific carrier accounts:", carrierAccounts);
    } else {
      console.log("⚠️  No carrier account IDs configured, using all active carriers");
    }
    
    console.log("📦 Request body:", JSON.stringify(requestBody, null, 2));
    
    const shipment = await shippoRequest("/shipments/", requestBody);

    console.log("Shipment response:", JSON.stringify(shipment, null, 2));

    // Check for address validation messages
    if (shipment.address_from?.messages && shipment.address_from.messages.length > 0) {
      console.error("❌ From address validation errors:", shipment.address_from.messages);
    }
    if (shipment.address_to?.messages && shipment.address_to.messages.length > 0) {
      console.error("❌ To address validation errors:", shipment.address_to.messages);
    }

    if (shipment.messages && shipment.messages.length > 0) {
      console.log("⚠️  Shipment messages:", JSON.stringify(shipment.messages, null, 2));
      
      // Check for critical errors
      const criticalErrors = shipment.messages.filter((m: any) => 
        m.code?.toLowerCase().includes('error') || m.source?.toLowerCase() === 'shippo'
      );
      if (criticalErrors.length > 0) {
        console.error("❌ Critical Shippo errors:", criticalErrors);
      }
    }

    const rates = shipment.rates || shipment.rates_list;
    
    // Log all rates for debugging
    console.log(`Shippo returned ${rates?.length || 0} rates`);
    if (rates && rates.length > 0) {
      console.log("Rate details:", rates.map((r: any) => ({
        provider: r.provider,
        service: r.servicelevel?.name || r.servicelevelName,
        amount: r.amount
      })));
    }
    
    if (!rates || rates.length === 0) {
      const errorDetails = [];
      
      // Log which carriers succeeded vs failed
      console.log("⚠️  NO RATES RETURNED - Analyzing carrier responses:");
      if (shipment.messages) {
        const upsErrors = shipment.messages.filter((m: any) => m.source === 'UPS');
        const uspsErrors = shipment.messages.filter((m: any) => m.source === 'USPS');
        console.log("UPS errors:", upsErrors.length, JSON.stringify(upsErrors));
        console.log("USPS errors:", uspsErrors.length, JSON.stringify(uspsErrors));
      }
      
      if (shipment.messages && shipment.messages.length > 0) {
        errorDetails.push(`Shippo messages: ${JSON.stringify(shipment.messages)}`);
      }
      if (shipment.address_from?.messages) {
        errorDetails.push(`From address issues: ${JSON.stringify(shipment.address_from.messages)}`);
      }
      if (shipment.address_to?.messages) {
        errorDetails.push(`To address issues: ${JSON.stringify(shipment.address_to.messages)}`);
      }
      
      const errorMsg = errorDetails.length > 0
        ? `Shippo returned no rates. Details: ${errorDetails.join('; ')}`
        : "No shipping rates available. Check Shippo dashboard for carrier account status.";
      
      console.error("❌", errorMsg);
      throw new Error(errorMsg);
    }

    const sorted = rates.sort((a: any, b: any) => Number(a.amount) - Number(b.amount));
    return sorted.slice(0, 5);
  } catch (error: any) {
    console.error("=== SHIPPO GET RATES ERROR ===");
    console.error("Error:", error);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    // Fallback: return a single flat-rate estimate so checkout can proceed
    const fallbackCents = 875;
    console.warn("Falling back to flat shipping rate:", fallbackCents, "cents");
    return [
      {
        amount: (fallbackCents / 100).toFixed(2),
        amount_local: (fallbackCents / 100).toFixed(2),
        currency: "USD",
        provider: "Fallback",
        servicelevel: { name: "Flat" },
        object_id: "fallback-rate"
      }
    ];
  }
}

export async function purchaseLabel({ rateId }: { rateId: string }) {
  console.log("=== SHIPPO PURCHASE LABEL DEBUG ===");
  console.log("Rate ID:", rateId);

  const tx = await shippoRequest("/transactions/", {
    rate: rateId,
    label_file_type: "PDF",
  });

  console.log("Transaction response:", JSON.stringify(tx, null, 2));

  if (tx.status !== "SUCCESS") {
    console.error("Transaction messages:", tx.messages);
    throw new Error(`Label purchase failed: ${JSON.stringify(tx.messages)}`);
  }

  return {
    transaction_id: tx.object_id,
    label_url: tx.label_url,
    tracking_number: tx.tracking_number,
    carrier: tx.rate?.provider,
    service: tx.rate?.servicelevel?.name || tx.rate?.servicelevel_name,
  };
}
