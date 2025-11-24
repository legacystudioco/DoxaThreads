/**
 * Test Shippo API - Run with: npx tsx test-shippo-rates.ts
 */

const SHIPPO_API_TOKEN = "shippo_live_0b72d21d1cd60cc62b15f45766aefdaa9deba886";
const SHIPPO_ENDPOINT = "https://api.goshippo.com";

async function testShippoRates() {
  console.log("=== TESTING SHIPPO API ===\n");

  const FROM = {
    name: "Stick-N-Stitch",
    street1: "7535 Easy Street",
    street2: "",
    city: "Mason",
    state: "OH",
    zip: "45040",
    country: "US",
    phone: "5551234567"
  };

  // Test address (use the one from your error email)
  const TO = {
    name: "Tyler",
    street1: "123 Test St",
    street2: "",
    city: "Columbus",
    state: "OH",
    zip: "43201",
    country: "US",
    phone: ""
  };

  // Standard t-shirt package
  const PARCEL = {
    length: "10",
    width: "5",
    height: "1",
    distance_unit: "in",
    weight: "8",
    mass_unit: "oz"
  };

  console.log("FROM:", JSON.stringify(FROM, null, 2));
  console.log("\nTO:", JSON.stringify(TO, null, 2));
  console.log("\nPARCEL:", JSON.stringify(PARCEL, null, 2));
  console.log("\n--- Making Shippo Request ---\n");

  try {
    const res = await fetch(`${SHIPPO_ENDPOINT}/shipments/`, {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${SHIPPO_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address_from: FROM,
        address_to: TO,
        parcels: [PARCEL],
        async: false,
      }),
    });

    const data = await res.json();

    console.log("Response Status:", res.status);
    console.log("\nFull Response:", JSON.stringify(data, null, 2));

    if (!res.ok) {
      console.error("\n❌ ERROR: Shippo API returned error status");
      return;
    }

    if (data.messages && data.messages.length > 0) {
      console.log("\n⚠️  MESSAGES:", JSON.stringify(data.messages, null, 2));
    }

    const rates = data.rates_list || data.rates || [];
    
    console.log(`\n✅ SUCCESS: Found ${rates.length} rates`);
    
    if (rates.length > 0) {
      console.log("\n--- Available Rates ---");
      rates.forEach((rate: any, idx: number) => {
        console.log(`\n${idx + 1}. ${rate.provider} - ${rate.servicelevel?.name || rate.servicelevel_name}`);
        console.log(`   Amount: $${rate.amount}`);
        console.log(`   Rate ID: ${rate.object_id}`);
        console.log(`   Days: ${rate.estimated_days}`);
      });
    } else {
      console.log("\n❌ NO RATES RETURNED");
      console.log("This usually means:");
      console.log("1. Your Shippo account doesn't have USPS/UPS/FedEx carriers enabled");
      console.log("2. The addresses are invalid");
      console.log("3. The parcel dimensions/weight are invalid");
    }
  } catch (error: any) {
    console.error("\n❌ EXCEPTION:", error.message);
    console.error(error.stack);
  }
}

testShippoRates();
