// Test direct API call to Supabase (bypass JS client)
const fetch = require('node-fetch');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

async function testDirectAPI() {
  console.log('🧪 Testing DIRECT API call to Supabase REST endpoint...\n');
  console.log('URL:', url);
  console.log('Using anon key:', key.substring(0, 20) + '...\n');

  const testData = {
    session_id: `direct_test_${Date.now()}`,
    page_path: '/test-direct',
    referrer: 'http://test.com',
    user_agent: 'Direct API Test',
    ip_address: '127.0.0.1',
    city: 'Test City',
    region: 'Test Region',
    country: 'Test Country',
    country_code: 'TC',
  };

  console.log('📝 Making POST request to /rest/v1/visitor_events...');

  try {
    const response = await fetch(`${url}/rest/v1/visitor_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(testData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.ok) {
      console.log('\n✅ SUCCESS! Direct API insert worked!');
      const data = JSON.parse(responseText);
      console.log('Inserted record:', data[0]);
      return true;
    } else {
      console.log('\n❌ FAILED! Direct API insert failed!');
      try {
        const error = JSON.parse(responseText);
        console.log('Error details:', error);
      } catch (e) {
        console.log('Raw error:', responseText);
      }
      return false;
    }
  } catch (error) {
    console.error('\n❌ Request error:', error.message);
    return false;
  }
}

testDirectAPI()
  .then(success => {
    if (success) {
      console.log('\n🎉 Visitor tracking API is working!');
      console.log('The issue might be with the JS client configuration.');
    } else {
      console.log('\n🔍 Need to investigate further...');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
