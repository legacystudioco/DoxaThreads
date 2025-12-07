const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

console.log('🚀 Newsletter Migration Setup\n');
console.log('This will create:');
console.log('  - newsletter_subscribers table');
console.log('  - DOXA-WELCOME discount code (20% off for first-time customers)');
console.log('\nTo run these migrations:');
console.log('1. Go to your Supabase Dashboard: https://app.supabase.com');
console.log('2. Navigate to SQL Editor');
console.log('3. Run the following SQL files in order:\n');

const migrations = [
  'migrations/create_newsletter_subscribers.sql',
  'migrations/add_doxa_welcome_code.sql'
];

migrations.forEach((migration, index) => {
  const fullPath = path.join(__dirname, migration);
  if (fs.existsSync(fullPath)) {
    console.log(`${index + 1}. ${migration} ✓`);
    console.log(`   File path: ${fullPath}\n`);
  } else {
    console.log(`${index + 1}. ${migration} ✗ (FILE NOT FOUND)`);
  }
});

console.log('\nSQL Preview:');
console.log('─'.repeat(80));

migrations.forEach(migration => {
  const fullPath = path.join(__dirname, migration);
  if (fs.existsSync(fullPath)) {
    console.log(`\n-- ${migration}`);
    console.log(fs.readFileSync(fullPath, 'utf-8'));
    console.log('─'.repeat(80));
  }
});
