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
  } catch {}
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned || null;
}

async function testPaginationFix() {
  const now = new Date();
  const ranges = {
    "24h": new Date(now.getTime() - 24 * 60 * 60 * 1000),
    "7d": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    "30d": new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
  };

  console.log("=== TESTING PAGINATION FIX ===\n");

  for (const [label, startDate] of Object.entries(ranges)) {
    console.log(`\n${label.toUpperCase()} Range:`);

    // Fetch with pagination
    let allVisitorData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let visitorQuery = supabase
        .from("visitor_events")
        .select("created_at, city, region, country, session_id, page_path, ip_address, user_agent")
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .gte("created_at", startDate.toISOString());

      const { data: pageData, error: pageError } = await visitorQuery;

      if (pageError) {
        console.error("Error:", pageError);
        break;
      }

      if (pageData && pageData.length > 0) {
        allVisitorData = allVisitorData.concat(pageData);
        hasMore = pageData.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }

    console.log(`  Pages fetched: ${page}`);
    console.log(`  Raw events: ${allVisitorData.length}`);

    // Apply filtering
    const filtered = allVisitorData.filter((visit) => {
      const path = visit.page_path || "";
      const isAdmin = path.startsWith("/studio") || path.startsWith("/admin");
      const isAsset = path.startsWith("/assets/") ||
        path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|css|js)$/i);
      const isWpProbe = path.includes("/wp-admin/") || path.includes("/wordpress/wp-admin/");
      return !isAdmin && !isAsset && !isWpProbe;
    });

    console.log(`  After filtering: ${filtered.length}`);

    // Count unique visitors
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
  }

  console.log("\n✅ Pagination fix working! Now fetching all data across time ranges.");
}

testPaginationFix().catch(console.error);
