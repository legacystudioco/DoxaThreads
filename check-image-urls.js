// Quick script to check what the actual image URLs look like in the database
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

async function checkUrls() {
  const { data, error } = await supabase
    .from('product_images')
    .select('id, url')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== Current Image URLs in Database ===\n');
  data.forEach(img => {
    console.log(`ID: ${img.id}`);
    console.log(`URL: ${img.url}`);
    console.log('---');
  });

  // Test if one of the URLs is accessible
  if (data.length > 0) {
    console.log('\n=== Testing first URL ===');
    try {
      const response = await fetch(data[0].url);
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    } catch (err) {
      console.error('Fetch error:', err.message);
    }
  }
}

checkUrls();
