/**
 * Test actual customer address from screenshot
 * Run with: npx tsx test-real-address.ts
 */

const SHIPPO_API_TOKEN = "shippo_live_0b72d21d1cd60cc62b15f45766aefdaa9deba886";
const SHIPPO_ENDPOINT = "https://api.goshippo.com";

async function testRealAddress() {
  console.log("=== TESTING REAL CUSTOMER ADDRESS ===\n");

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

  // EXACT address from your screenshot
  const TO = {
    name: "Tyler Test",
    street1: "One Apple Park Way",
    street2: "",
    city: "Cupertino",
    state: "CA",
    zip: "95014",
    country: "US",
    phone: ""
  };

  // Standard t-shirt package (assuming size S, single item)
  const PARCEL = {
    length: "10",
    width: "5",
    height: "1",
    distance_unit: "in",
    weight: "5", // Size S is typically 4.5oz, round to 5
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

    // Check address validation
    if (data.address_to?.messages && data.address_to.messages.length > 0) {
      console.log("\n⚠️  TO ADDRESS VALIDATION MESSAGES:");
      console.log(JSON.stringify(data.address_to.messages, null, 2));
    }

    if (data.messages && data.messages.length > 0) {
      console.log("\n⚠️  SHIPMENT MESSAGES:", JSON.stringify(data.messages, null, 2));
    }

    const rates = data.rates || data.rates_list || [];
    
    console.log(`\n${rates.length > 0 ? '✅' : '❌'} Found ${rates.length} rates`);
    
    if (rates.length > 0) {
      console.log("\n--- Available Rates ---");
      rates.forEach((rate: any, idx: number) => {
        console.log(`\n${idx + 1}. ${rate.provider} - ${rate.servicelevel?.name || rate.servicelevel_name}`);
        console.log(`   Amount: $${rate.amount}`);
        console.log(`   Rate ID: ${rate.object_id}`);
      });
      
      console.log("\n✅ SUCCESS: This address should work!");
    } else {
      console.log("\n❌ NO RATES RETURNED FOR THIS ADDRESS");
      console.log("\nThis is the exact issue happening in production!");
      console.log("Check messages above for why Shippo rejected this address.");
    }
  } catch (error: any) {
    console.error("\n❌ EXCEPTION:", error.message);
    console.error(error.stack);
  }
}

testRealAddress();
