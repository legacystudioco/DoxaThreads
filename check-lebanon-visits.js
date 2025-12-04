const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLebanonVisits() {
  console.log('\n=== CHECKING LEBANON VISITS ===\n');

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Fetch all events from last 24h
    let allEvents = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from('visitor_events')
        .select('*')
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error || !data || data.length === 0) break;
      allEvents = allEvents.concat(data);
      if (data.length < pageSize) break;
      page++;
    }

    console.log(`Total events in last 24h: ${allEvents.length}\n`);

    // Check for /studio pages
    const studioEvents = allEvents.filter(e =>
      e.page_path && e.page_path.startsWith('/studio')
    );

    if (studioEvents.length > 0) {
      console.log('⚠️  WARNING: /studio pages ARE being tracked!');
      console.log(`   Found ${studioEvents.length} admin page events:\n`);

      const studioSessionMap = {};
      studioEvents.forEach(e => {
        if (!studioSessionMap[e.session_id]) {
          studioSessionMap[e.session_id] = {
            events: [],
            city: e.city,
            country: e.country
          };
        }
        studioSessionMap[e.session_id].events.push(e);
      });

      console.log(`   Unique admin sessions: ${Object.keys(studioSessionMap).length}`);
      console.log('\n   Sample admin events:');
      studioEvents.slice(0, 10).forEach(e => {
        console.log(`   - ${e.page_path} (${e.city}, ${e.country}) [${e.session_id.substring(0, 10)}...]`);
      });
      console.log('');
    } else {
      console.log('✅ No /studio pages being tracked\n');
    }

    // Lebanon analysis
    const lebanonEvents = allEvents.filter(e =>
      e.country === 'Lebanon' || e.country_code === 'LB'
    );

    console.log(`Lebanon Events: ${lebanonEvents.length}`);

    // Get unique sessions
    const lebanonSessions = new Set(lebanonEvents.map(e => e.session_id));
    console.log(`Lebanon Unique Sessions: ${lebanonSessions.size}\n`);

    console.log('The difference between:');
    console.log(`  - ${lebanonEvents.length} events = Total page views from Lebanon`);
    console.log(`  - ${lebanonSessions.size} sessions = Actual unique visitors from Lebanon\n`);

    // Show what the analytics page is calculating
    const cityMap = new Map();
    allEvents.forEach((visit) => {
      const keyParts = [
        visit.city || "Unknown City",
        visit.region || "",
        visit.country || "",
      ];
      const key = keyParts.join("|");
      const existing = cityMap.get(key);
      if (existing) {
        existing.count += 1;
        existing.sessions.add(visit.session_id);
      } else {
        cityMap.set(key, {
          city: visit.city || "Unknown City",
          region: visit.region || undefined,
          country: visit.country || undefined,
          count: 1,
          sessions: new Set([visit.session_id])
        });
      }
    });

    const topCities = Array.from(cityMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    console.log('=== TOP CITIES (As Shown in Analytics) ===\n');
    topCities.forEach((city, i) => {
      console.log(`${i + 1}. ${city.city}, ${city.region || ''} ${city.country || ''}`);
      console.log(`   Events (page views): ${city.count}`);
      console.log(`   Unique sessions (actual visitors): ${city.sessions.size}`);
      console.log(`   Avg pages per visitor: ${(city.count / city.sessions.size).toFixed(1)}`);
      console.log('');
    });

    // Check Lebanon session details
    if (lebanonSessions.size > 0) {
      console.log('=== LEBANON SESSION DETAILS (Last 5) ===\n');

      const lebanonSessionDetails = Array.from(lebanonSessions).slice(0, 5).map(sessionId => {
        const events = lebanonEvents.filter(e => e.session_id === sessionId);
        return {
          sessionId,
          eventCount: events.length,
          pages: events.map(e => e.page_path),
          city: events[0].city,
          firstSeen: events[0].created_at
        };
      }).sort((a, b) => new Date(b.firstSeen) - new Date(a.firstSeen));

      lebanonSessionDetails.forEach((session, i) => {
        console.log(`Session ${i + 1}: ${session.sessionId.substring(0, 20)}...`);
        console.log(`  City: ${session.city}`);
        console.log(`  Time: ${new Date(session.firstSeen).toLocaleString()}`);
        console.log(`  Pages viewed: ${session.eventCount}`);
        console.log(`  Pages:`);
        session.pages.forEach(p => console.log(`    - ${p}`));
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkLebanonVisits().then(() => {
  console.log('=== CHECK COMPLETE ===\n');
  process.exit(0);
});
