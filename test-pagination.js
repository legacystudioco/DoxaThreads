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

async function testPagination() {
  const now = new Date();
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  console.log("Testing pagination approach...\n");

  // Try fetching with range
  const { data, error, count } = await supabase
    .from("visitor_events")
    .select("created_at, session_id, ip_address, user_agent, page_path", { count: "exact" })
    .gte("created_at", startDate.toISOString())
    .range(0, 9999);

  console.log(`Total count: ${count}`);
  console.log(`Fetched: ${data?.length || 0}`);

  if (error) {
    console.error("Error:", error);
  }
}

testPagination().catch(console.error);
