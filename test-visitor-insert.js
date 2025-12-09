// Test visitor_events insert as anon user
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    env[key.trim()] = value.join('=').trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testInsert() {
  console.log('Testing visitor_events INSERT as anonymous user...\n');

  const testData = {
    session_id: 'test_' + Date.now(),
    page_path: '/test',
    city: 'Test City',
    country: 'Test Country'
  };

  const { data, error } = await supabase
    .from('visitor_events')
    .insert(testData)
    .select();

  if (error) {
    console.error('❌ ERROR:', error);
    console.error('\nError details:');
    console.error('  Code:', error.code);
    console.error('  Message:', error.message);
    console.error('  Details:', error.details);
    console.error('  Hint:', error.hint);
  } else {
    console.log('✅ SUCCESS! Inserted visitor event:');
    console.log(data);
  }
}

testInsert();
