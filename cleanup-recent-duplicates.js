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

async function cleanupRecentDuplicates() {
  console.log('\n=== CLEANING UP DUPLICATE AND ASSET EVENTS ===\n');

  try {
    // Fetch all events
    let allEvents = [];
    let page = 0;
    const pageSize = 1000;

    console.log('Fetching all events...');
    while (true) {
      const { data, error } = await supabase
        .from('visitor_events')
        .select('*')
        .order('created_at', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error('Error:', error);
        return;
      }

      if (!data || data.length === 0) break;
      allEvents = allEvents.concat(data);
      console.log(`  Fetched ${data.length} events (total: ${allEvents.length})`);
      if (data.length < pageSize) break;
      page++;
    }

    console.log(`\n📊 Total events: ${allEvents.length}\n`);

    // 1. Find asset files
    const assetEvents = allEvents.filter(e => {
      const path = decodeURIComponent(e.page_path || '');
      return path.startsWith('/assets/') ||
             path.startsWith('/_next/') ||
             path.startsWith('/api/') ||
             path.includes('/Blanks/') ||
             path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|css|js|json|xml|txt)$/i);
    });

    console.log(`🗑️  Found ${assetEvents.length} asset/API events to remove\n`);

    // 2. Find duplicates - keep only the FIRST occurrence per session+page
    const seenSessionPages = new Set();
    const duplicateEvents = [];

    allEvents
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .forEach(event => {
        const key = `${event.session_id}|${event.page_path}`;

        // Skip if this is an asset (will be deleted anyway)
        if (assetEvents.find(a => a.id === event.id)) {
          return;
        }

        if (seenSessionPages.has(key)) {
          duplicateEvents.push(event);
        } else {
          seenSessionPages.add(key);
        }
      });

    console.log(`🗑️  Found ${duplicateEvents.length} duplicate events to remove\n`);

    // Combine all events to delete
    const toDelete = [...assetEvents, ...duplicateEvents];
    const uniqueToDelete = [...new Map(toDelete.map(e => [e.id, e])).values()];

    console.log(`📋 Total events to delete: ${uniqueToDelete.length}\n`);

    if (uniqueToDelete.length === 0) {
      console.log('✅ Nothing to clean up!');
      return;
    }

    // Show samples
    console.log('Sample of events to be deleted:');
    console.log('\nAsset files:');
    assetEvents.slice(0, 5).forEach(e => {
      console.log(`  - ${e.page_path} (${new Date(e.created_at).toLocaleString()})`);
    });

    console.log('\nDuplicates:');
    duplicateEvents.slice(0, 5).forEach(e => {
      console.log(`  - ${e.page_path} [session: ${e.session_id.substring(0, 10)}...] (${new Date(e.created_at).toLocaleString()})`);
    });

    console.log('\n⚠️  Are you sure you want to delete these? (Y/n)');
    console.log('   This will remove ' + uniqueToDelete.length + ' events from your database.');
    console.log('\n   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete in batches
    const batchSize = 100;
    let deleted = 0;

    for (let i = 0; i < uniqueToDelete.length; i += batchSize) {
      const batch = uniqueToDelete.slice(i, i + batchSize);
      const ids = batch.map(e => e.id);

      const { error } = await supabase
        .from('visitor_events')
        .delete()
        .in('id', ids);

      if (error) {
        console.error(`❌ Error deleting batch: `, error);
      } else {
        deleted += ids.length;
        console.log(`✅ Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(uniqueToDelete.length / batchSize)} (${deleted}/${uniqueToDelete.length})`);
      }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${deleted} events\n`);

    // Verify
    const { data: remaining } = await supabase
      .from('visitor_events')
      .select('id, session_id, page_path')
      .limit(1000);

    console.log(`📊 Events remaining in database: ${remaining?.length || 'unknown'}\n`);

  } catch (error) {
    console.error('Error:', error);
  }
}

cleanupRecentDuplicates().then(() => {
  console.log('=== CLEANUP COMPLETE ===\n');
  process.exit(0);
});
