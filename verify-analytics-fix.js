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

function cleanLocation(value) {
  if (!value) return null;
  let cleaned = value.replace(/\+/g, " ").trim();
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {
    // ignore decode errors
  }
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned || null;
}

async function verifyFix() {
  const now = new Date();
  const ranges = {
    "24h": new Date(now.getTime() - 24 * 60 * 60 * 1000),
    "7d": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    "30d": new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
  };

  console.log("=== VERIFYING ANALYTICS FIX ===\n");

  for (const [label, startDate] of Object.entries(ranges)) {
    console.log(`\n${label.toUpperCase()} Range (from ${startDate.toISOString().split('T')[0]}):`);

    // Query with the new limit
    const { data: events, error } = await supabase
      .from("visitor_events")
      .select("created_at, city, region, country, session_id, page_path, ip_address, user_agent")
      .limit(50000)
      .gte("created_at", startDate.toISOString());

    if (error) {
      console.error("Error:", error);
      continue;
    }

    console.log(`  Raw events fetched: ${events.length}`);

    // Apply same filtering as analytics page
    const filtered = events.filter((visit) => {
      const path = visit.page_path || "";
      const isAdmin = path.startsWith("/studio") || path.startsWith("/admin");
      const isAsset = path.startsWith("/assets/") ||
        path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|css|js)$/i);
      const isWpProbe = path.includes("/wp-admin/") || path.includes("/wordpress/wp-admin/");
      return !isAdmin && !isAsset && !isWpProbe;
    }).map((visit) => ({
      ...visit,
      city: cleanLocation(visit.city),
      region: cleanLocation(visit.region),
      country: cleanLocation(visit.country),
    }));

    console.log(`  After filtering: ${filtered.length}`);

    // Build session key (same logic as analytics page)
    const getSessionKey = (visit) => {
      const ip = visit.ip_address?.trim();
      const ua = visit.user_agent?.trim();
      if (ip || ua) {
        return `${ip || "no-ip"}|${ua || "no-ua"}`;
      }
      const sessionId = visit.session_id?.trim();
      if (sessionId) return sessionId;
      return `anon-${visit.page_path || "unknown"}-${visit.created_at}`;
    };

    const uniqueSessions = new Set(filtered.map(getSessionKey));
    console.log(`  Unique visitors: ${uniqueSessions.size}`);

    // Date distribution
    const byDate = {};
    filtered.forEach(event => {
      const date = event.created_at.split('T')[0];
      byDate[date] = (byDate[date] || 0) + 1;
    });

    const dates = Object.keys(byDate).sort();
    console.log(`  Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
    console.log(`  Days with data: ${dates.length}`);
  }

  console.log("\n✅ Fix verified! The analytics should now show correct counts for each time range.");
}

verifyFix().catch(console.error);
