const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local manually
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

async function verifyTrackingAccuracy() {
  console.log('\n=== VISITOR TRACKING ACCURACY CHECK ===\n');

  try {
    // Fetch recent events (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

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

      if (error) {
        console.error('❌ Error:', error);
        return;
      }

      if (!data || data.length === 0) break;
      allEvents = allEvents.concat(data);
      if (data.length < pageSize) break;
      page++;
    }

    console.log(`📊 Total events in last 24 hours: ${allEvents.length}\n`);

    // Check for any remaining asset files
    const assetEvents = allEvents.filter(e => {
      const path = e.page_path || '';
      return path.startsWith('/assets/') ||
             path.startsWith('/_next/') ||
             path.startsWith('/api/') ||
             path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|css|js|json|xml|txt)$/i);
    });

    if (assetEvents.length > 0) {
      console.log('⚠️  WARNING: Still tracking asset files!');
      console.log(`   Found ${assetEvents.length} asset events:\n`);
      assetEvents.slice(0, 10).forEach(e => {
        console.log(`   - ${e.page_path} (${new Date(e.created_at).toLocaleString()})`);
      });
      console.log('');
    } else {
      console.log('✅ No asset files being tracked!\n');
    }

    // Analyze sessions
    const sessionMap = {};
    allEvents.forEach(event => {
      if (!sessionMap[event.session_id]) {
        sessionMap[event.session_id] = {
          events: [],
          pages: new Set(),
          firstSeen: event.created_at,
          lastSeen: event.created_at
        };
      }
      sessionMap[event.session_id].events.push(event);
      sessionMap[event.session_id].pages.add(event.page_path);

      if (event.created_at > sessionMap[event.session_id].lastSeen) {
        sessionMap[event.session_id].lastSeen = event.created_at;
      }
      if (event.created_at < sessionMap[event.session_id].firstSeen) {
        sessionMap[event.session_id].firstSeen = event.created_at;
      }
    });

    const sessions = Object.entries(sessionMap).map(([id, data]) => ({
      id,
      ...data,
      uniquePages: data.pages.size,
      duration: new Date(data.lastSeen) - new Date(data.firstSeen)
    }));

    console.log(`👥 Unique sessions: ${sessions.length}`);
    console.log(`📈 Average events per session: ${(allEvents.length / sessions.length).toFixed(2)}\n`);

    // Show sample sessions
    console.log('=== SAMPLE SESSIONS (Most Recent) ===\n');

    sessions.sort((a, b) => new Date(b.firstSeen) - new Date(a.firstSeen)).slice(0, 5).forEach((session, i) => {
      console.log(`Session ${i + 1}: ${session.id.substring(0, 20)}...`);
      console.log(`  Started: ${new Date(session.firstSeen).toLocaleString()}`);
      console.log(`  Duration: ${Math.round(session.duration / 1000)}s`);
      console.log(`  Total events: ${session.events.length}`);
      console.log(`  Unique pages: ${session.uniquePages}`);

      // Check for duplicates
      const pageCounts = {};
      session.events.forEach(e => {
        pageCounts[e.page_path] = (pageCounts[e.page_path] || 0) + 1;
      });

      const duplicates = Object.entries(pageCounts).filter(([_, count]) => count > 1);

      if (duplicates.length > 0) {
        console.log('  ⚠️  DUPLICATE PAGES:');
        duplicates.forEach(([page, count]) => {
          console.log(`     - ${page}: ${count}x`);
        });
      } else {
        console.log('  ✅ No duplicate pages');
      }

      console.log('  Pages visited:');
      Array.from(session.pages).slice(0, 5).forEach(page => {
        console.log(`     - ${page}`);
      });
      if (session.pages.size > 5) {
        console.log(`     ... and ${session.pages.size - 5} more`);
      }
      console.log('');
    });

    // Check for suspicious patterns
    console.log('=== SUSPICIOUS PATTERNS CHECK ===\n');

    const highEventSessions = sessions.filter(s => s.events.length > 20);
    if (highEventSessions.length > 0) {
      console.log(`⚠️  ${highEventSessions.length} sessions with >20 events:\n`);
      highEventSessions.slice(0, 3).forEach(s => {
        console.log(`   Session: ${s.id.substring(0, 20)}...`);
        console.log(`   Events: ${s.events.length}, Unique pages: ${s.uniquePages}`);
        console.log(`   Ratio: ${(s.events.length / s.uniquePages).toFixed(2)} events per unique page`);

        if ((s.events.length / s.uniquePages) > 2) {
          console.log(`   ⚠️  HIGH DUPLICATION DETECTED!`);
        }
        console.log('');
      });
    } else {
      console.log('✅ No sessions with excessive events\n');
    }

    // Time-based analysis
    console.log('=== TIME-BASED ANALYSIS ===\n');

    const now = new Date();
    const timeRanges = {
      'Last 5 minutes': 5 * 60 * 1000,
      'Last hour': 60 * 60 * 1000,
      'Last 6 hours': 6 * 60 * 60 * 1000,
    };

    Object.entries(timeRanges).forEach(([label, ms]) => {
      const cutoff = new Date(now - ms);
      const recentEvents = allEvents.filter(e => new Date(e.created_at) >= cutoff);
      const recentSessions = new Set(recentEvents.map(e => e.session_id));

      console.log(`${label}:`);
      console.log(`  Events: ${recentEvents.length}`);
      console.log(`  Unique sessions: ${recentSessions.size}`);
      console.log(`  Avg per session: ${recentSessions.size > 0 ? (recentEvents.length / recentSessions.size).toFixed(2) : 0}`);
      console.log('');
    });

    // Final verdict
    console.log('=== VERDICT ===\n');

    const avgEventsPerSession = allEvents.length / sessions.length;
    const avgUniquePages = sessions.reduce((sum, s) => sum + s.uniquePages, 0) / sessions.length;
    const duplicationRatio = avgEventsPerSession / avgUniquePages;

    console.log(`Average events per session: ${avgEventsPerSession.toFixed(2)}`);
    console.log(`Average unique pages per session: ${avgUniquePages.toFixed(2)}`);
    console.log(`Duplication ratio: ${duplicationRatio.toFixed(2)}x\n`);

    if (duplicationRatio > 1.5) {
      console.log('⚠️  WARNING: High duplication detected!');
      console.log('   Each unique page is being tracked ~' + duplicationRatio.toFixed(1) + 'x on average');
      console.log('   Expected: 1.0x (each page tracked once per session)');
      console.log('   This suggests the deduplication is not working properly.\n');
    } else {
      console.log('✅ Duplication ratio looks good!');
      console.log('   Pages are being tracked once per session as expected.\n');
    }

    if (avgEventsPerSession > 15) {
      console.log('⚠️  Average events per session is high (>15)');
      console.log('   This could indicate:\n');
      console.log('   1. Users are genuinely browsing many pages');
      console.log('   2. OR there\'s still duplicate tracking happening');
      console.log('   3. OR bot/crawler traffic\n');
    } else if (avgEventsPerSession > 10) {
      console.log('⚙️  Average events per session is moderate (10-15)');
      console.log('   This is normal for engaged users browsing the store.\n');
    } else {
      console.log('✅ Average events per session looks healthy (<10)');
      console.log('   This suggests normal browsing behavior.\n');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

verifyTrackingAccuracy().then(() => {
  console.log('=== CHECK COMPLETE ===\n');
  process.exit(0);
});
