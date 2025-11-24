import { NextRequest, NextResponse } from "next/server";
import { getRates } from "@/lib/shippo";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    console.log("=== SHIPPO DIAGNOSTIC TEST ===");

    // Test address
    const testAddress = {
      name: "Test Customer",
      street1: "123 Main St",
      street2: "",
      city: "Columbus",
      state: "OH",
      zip: "43201",
      country: "US",
      phone: ""
    };

    // Standard t-shirt package
    const testParcel = {
      length: "10",
      width: "5",
      height: "1",
      distanceUnit: "in" as const,
      weight: "8",
      massUnit: "oz" as const
    };

    console.log("Test Address:", testAddress);
    console.log("Test Parcel:", testParcel);

    const rates = await getRates({ 
      toAddress: testAddress, 
      parcel: testParcel 
    });

    console.log("Rates returned:", rates?.length || 0);

    if (!rates || rates.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No rates returned from Shippo",
        message: "Your Shippo account may not have carrier accounts configured",
        testAddress,
        testParcel
      });
    }

    // Format rates for response
    const formattedRates = rates.map((rate: any) => ({
      provider: rate.provider,
      service: rate.servicelevel?.name || rate.servicelevel_name,
      amount: rate.amount,
      rateId: rate.objectId || rate.object_id,
      days: rate.estimated_days || rate.days
    }));

    console.log("Success! Formatted rates:", formattedRates);

    return NextResponse.json({
      success: true,
      message: "Shippo API is working correctly!",
      ratesCount: rates.length,
      rates: formattedRates,
      testAddress,
      testParcel
    });

  } catch (error: any) {
    console.error("=== SHIPPO DIAGNOSTIC ERROR ===");
    console.error("Error:", error);
    console.error("Message:", error.message);

    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      message: "Shippo API test failed - see error details above"
    }, { status: 500 });
  }
}
