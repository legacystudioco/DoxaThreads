const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

// Load .env.local manually
const envPath = ".env.local";
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTotalEvents() {
  const now = new Date();
  const ranges = {
    "24h": new Date(now.getTime() - 24 * 60 * 60 * 1000),
    "7d": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    "30d": new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
  };

  console.log("=== EVENT COUNTS BY TIME RANGE ===\n");

  for (const [label, startDate] of Object.entries(ranges)) {
    const { count, error } = await supabase
      .from("visitor_events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString());

    if (error) {
      console.error(`Error counting ${label}:`, error);
    } else {
      console.log(`${label}: ${count} total events`);
    }
  }

  // Total events in table
  const { count: totalCount } = await supabase
    .from("visitor_events")
    .select("*", { count: "exact", head: true });

  console.log(`\nAll time: ${totalCount} total events`);
}

checkTotalEvents().catch(console.error);
