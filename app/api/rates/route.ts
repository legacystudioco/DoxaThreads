import { NextRequest, NextResponse } from "next/server";
import { getRates } from "@/lib/shippo";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json(); // { items, toAddress, parcel }
  const rates = await getRates(body);
  return NextResponse.json({ rates });
}
