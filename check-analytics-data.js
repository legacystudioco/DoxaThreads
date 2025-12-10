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

async function checkAnalytics() {
  const now = new Date();

  // Define time ranges
  const ranges = {
    "24h": new Date(now.getTime() - 24 * 60 * 60 * 1000),
    "7d": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    "30d": new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
  };

  console.log("\n=== ANALYTICS DATA BREAKDOWN ===\n");
  console.log("Current time:", now.toISOString());
  console.log("\nTime Range Cutoffs:");
  console.log("  24h starts:", ranges["24h"].toISOString());
  console.log("  7d starts:", ranges["7d"].toISOString());
  console.log("  30d starts:", ranges["30d"].toISOString());

  for (const [label, startDate] of Object.entries(ranges)) {
    console.log(`\n\n=== ${label.toUpperCase()} ANALYSIS ===`);

    // Get all visitor events in this range
    const { data: events, error } = await supabase
      .from("visitor_events")
      .select("created_at, session_id, ip_address, user_agent, page_path, city")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error:", error);
      continue;
    }

    console.log(`Total raw events: ${events.length}`);

    // Filter out admin/assets (same logic as analytics page)
    const filteredEvents = events.filter((visit) => {
      const path = visit.page_path || "";
      const isAdmin = path.startsWith("/studio") || path.startsWith("/admin");
      const isAsset = path.startsWith("/assets/") ||
        path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|css|js)$/i);
      const isWpProbe = path.includes("/wp-admin/") || path.includes("/wordpress/wp-admin/");
      return !isAdmin && !isAsset && !isWpProbe;
    });

    console.log(`After filtering (no admin/assets): ${filteredEvents.length}`);

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

    // Count unique sessions
    const uniqueSessions = new Set(filteredEvents.map(getSessionKey));
    console.log(`Unique visitors (by session): ${uniqueSessions.size}`);

    // Show sample of recent events
    console.log("\nSample of recent events:");
    filteredEvents.slice(0, 5).forEach((event, i) => {
      console.log(`  ${i + 1}. ${event.created_at} | ${event.page_path || '/'} | ${event.city || 'Unknown'}`);
      console.log(`     Session: ${getSessionKey(event).substring(0, 50)}...`);
    });

    // Show date distribution
    const byDate = {};
    filteredEvents.forEach(event => {
      const date = event.created_at.split('T')[0];
      byDate[date] = (byDate[date] || 0) + 1;
    });

    console.log("\nEvents by date:");
    Object.entries(byDate)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .forEach(([date, count]) => {
        console.log(`  ${date}: ${count} events`);
      });
  }

  // Check for potential data issues
  console.log("\n\n=== POTENTIAL ISSUES ===");

  const { data: recentEvents } = await supabase
    .from("visitor_events")
    .select("created_at, session_id, ip_address")
    .gte("created_at", ranges["30d"].toISOString())
    .order("created_at", { ascending: false })
    .limit(100);

  // Check for missing session IDs
  const missingSession = recentEvents.filter(e => !e.session_id && !e.ip_address);
  console.log(`Events with no session_id or IP: ${missingSession.length}/100`);

  // Check for duplicate sessions
  const sessionCounts = {};
  recentEvents.forEach(e => {
    const key = e.session_id || e.ip_address || 'none';
    sessionCounts[key] = (sessionCounts[key] || 0) + 1;
  });

  const duplicates = Object.entries(sessionCounts)
    .filter(([_, count]) => count > 10)
    .sort((a, b) => b[1] - a[1]);

  if (duplicates.length > 0) {
    console.log("\nSessions with >10 events (top 5):");
    duplicates.slice(0, 5).forEach(([session, count]) => {
      console.log(`  ${session.substring(0, 30)}...: ${count} events`);
    });
  }
}

checkAnalytics().catch(console.error);
