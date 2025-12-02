import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testVisitorTracking() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.log('Need: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return;
  }

  console.log('✅ Supabase credentials found');
  console.log(`   URL: ${supabaseUrl}`);
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Test 1: Check if table exists
  console.log('\n📋 Test 1: Checking if visitor_events table exists...');
  const { data: tableCheck, error: tableError } = await supabase
    .from('visitor_events')
    .select('*')
    .limit(1);

  if (tableError) {
    if (tableError.code === '42P01') {
      console.error('❌ Table "visitor_events" does not exist!');
      console.log('\n💡 To fix: Run the migration:');
      console.log('   psql -h [your-db-host] -U postgres -d postgres -f migrations/create_visitor_events.sql');
    } else {
      console.error('❌ Error accessing visitor_events:', tableError.message);
      console.log('   Code:', tableError.code);
      console.log('   Details:', tableError.details);
    }
    return;
  }

  console.log('✅ visitor_events table exists');

  // Test 2: Count existing records
  console.log('\n📊 Test 2: Counting existing visitor records...');
  const { count, error: countError } = await supabase
    .from('visitor_events')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error counting records:', countError.message);
    return;
  }

  console.log(`✅ Found ${count} visitor records`);

  // Test 3: Try to insert a test record
  console.log('\n✍️  Test 3: Attempting to insert a test visitor event...');
  const testSessionId = `test_${Date.now()}`;
  const { data: insertData, error: insertError } = await supabase
    .from('visitor_events')
    .insert({
      session_id: testSessionId,
      page_path: '/test',
      referrer: 'test-script',
      user_agent: 'diagnostic-script',
      city: 'Test City',
      region: 'Test Region',
      country: 'Test Country',
    })
    .select();

  if (insertError) {
    console.error('❌ Failed to insert test record');
    console.error('   Error:', insertError.message);
    console.error('   Code:', insertError.code);
    console.error('   Details:', insertError.details);
    
    if (insertError.code === '42501') {
      console.log('\n💡 This is an RLS (Row Level Security) issue!');
      console.log('   The anon role cannot insert records.');
      console.log('   Check your RLS policies on the visitor_events table.');
    }
    return;
  }

  console.log('✅ Successfully inserted test record:', insertData?.[0]?.id);

  // Test 4: Try to read it back
  console.log('\n📖 Test 4: Reading back the test record...');
  const { data: readData, error: readError } = await supabase
    .from('visitor_events')
    .select('*')
    .eq('session_id', testSessionId)
    .single();

  if (readError) {
    console.error('❌ Failed to read test record:', readError.message);
    return;
  }

  console.log('✅ Successfully read test record');

  // Test 5: Get recent records (last 24 hours)
  console.log('\n🕐 Test 5: Getting recent visitor records (last 24 hours)...');
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentData, error: recentError } = await supabase
    .from('visitor_events')
    .select('*')
    .gte('created_at', yesterday)
    .order('created_at', { ascending: false })
    .limit(10);

  if (recentError) {
    console.error('❌ Failed to get recent records:', recentError.message);
    return;
  }

  console.log(`✅ Found ${recentData?.length || 0} records in last 24 hours`);
  if (recentData && recentData.length > 0) {
    console.log('\n📝 Sample records:');
    recentData.forEach((record, i) => {
      console.log(`   ${i + 1}. ${record.page_path} - ${new Date(record.created_at).toLocaleString()}`);
      console.log(`      Session: ${record.session_id}`);
      console.log(`      Location: ${record.city}, ${record.region}, ${record.country}`);
    });
  }

  // Test 6: Delete test record
  console.log('\n🗑️  Test 6: Cleaning up test record...');
  const { error: deleteError } = await supabase
    .from('visitor_events')
    .delete()
    .eq('session_id', testSessionId);

  if (deleteError) {
    console.log('⚠️  Could not delete test record (might be RLS):', deleteError.message);
  } else {
    console.log('✅ Test record cleaned up');
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total visitor records in database: ${count}`);
  console.log(`Recent records (24h): ${recentData?.length || 0}`);
  
  if (count === 0) {
    console.log('\n⚠️  NO VISITOR DATA FOUND!');
    console.log('   Possible causes:');
    console.log('   1. The VisitorTracker component is not being loaded');
    console.log('   2. Visitors are being tracked but data is not persisting');
    console.log('   3. There is a JavaScript error preventing tracking');
    console.log('\n💡 Next steps:');
    console.log('   1. Check browser console for errors when visiting the site');
    console.log('   2. Verify VisitorTracker is in app/layout.tsx');
    console.log('   3. Test in production (not localhost)');
  } else {
    console.log('\n✅ Visitor tracking appears to be working!');
    console.log('   If analytics still show 0, check:');
    console.log('   1. Time range filters in the dashboard');
    console.log('   2. Authentication in the analytics page');
    console.log('   3. RLS policies for authenticated users');
  }
}

testVisitorTracking().catch(console.error);
