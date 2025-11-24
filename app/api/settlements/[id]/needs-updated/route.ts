

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supa = createServiceClient();

  await supa.from("settlements").update({ status: "ADJUST_REQUESTED" }).eq("id", params.id);
  await supa.from("printer_actions").insert({ settlement_id: params.id, action: "NEEDS_UPDATED" });

  const redirectUrl = new URL("/studio/settlements?ok=needs-updated", process.env.SITE_URL || "http://localhost:3000");
  return NextResponse.redirect(redirectUrl);
}