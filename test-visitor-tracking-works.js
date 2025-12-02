// Test that visitor tracking NOW works after RLS fix
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(url, key);

async function testTracking() {
  console.log('🧪 Testing visitor tracking after RLS fix...\n');

  // Test 1: Can we insert now?
  const testData = {
    session_id: `test_success_${Date.now()}`,
    page_path: '/test-after-fix',
    referrer: 'http://test.com',
    user_agent: 'Test User Agent',
    ip_address: '127.0.0.1',
    city: 'Test City',
    region: 'Test Region',
    country: 'Test Country',
    country_code: 'TC',
    latitude: 0.0,
    longitude: 0.0,
  };

  console.log('📝 Test 1: Attempting to insert as anonymous user...');
  const { data, error } = await supabase
    .from('visitor_events')
    .insert(testData)
    .select();

  if (error) {
    console.error('\n❌ INSERT STILL FAILING!');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    return false;
  }

  console.log('✅ INSERT SUCCESSFUL!');
  console.log('   Record ID:', data[0]?.id);

  // Test 2: Check total records now
  console.log('\n📊 Test 2: Checking total records in visitor_events...');
  const { count, error: countError } = await supabase
    .from('visitor_events')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.log('⚠️  Cannot count (anonymous users can only INSERT, not SELECT)');
    console.log('   This is expected and correct for security!');
  } else {
    console.log(`✅ Total records: ${count || 0}`);
  }

  console.log('\n🎉 SUCCESS! Visitor tracking is now working!');
  console.log('\n📋 Next steps:');
  console.log('   1. Visit your site in an incognito window');
  console.log('   2. Browse a few pages');
  console.log('   3. Check /studio/analytics after 30 seconds');
  console.log('   4. You should see visitors being tracked!');

  return true;
}

testTracking()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
