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

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration(filePath) {
  console.log(`\n📄 Running migration: ${path.basename(filePath)}`);

  try {
    const sql = fs.readFileSync(filePath, 'utf-8');

    // Split SQL by statements (simple approach - may need refinement for complex SQL)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement) {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (error) {
          // Try direct query if RPC doesn't exist
          const { error: directError } = await supabase.from('_migrations').select('*').limit(0);

          // Execute via raw query
          console.log('   Executing statement...');
          // Note: Supabase client doesn't support raw SQL execution
          // You'll need to run these migrations through Supabase Dashboard SQL Editor
          console.log('⚠️  Please run this migration through Supabase Dashboard SQL Editor');
          console.log('   Or use the Supabase CLI: supabase db push');
          return false;
        }
      }
    }

    console.log('✅ Migration completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database migrations...\n');

  const migrations = [
    'migrations/create_discount_codes.sql',
    'migrations/add_discount_to_orders.sql'
  ];

  let allSucceeded = true;

  for (const migration of migrations) {
    const fullPath = path.join(__dirname, migration);
    if (fs.existsSync(fullPath)) {
      const success = await runMigration(fullPath);
      if (!success) allSucceeded = false;
    } else {
      console.log(`⚠️  Migration file not found: ${migration}`);
      allSucceeded = false;
    }
  }

  if (allSucceeded) {
    console.log('\n🎉 All migrations completed successfully!');
  } else {
    console.log('\n⚠️  Some migrations need to be run manually.');
    console.log('\nTo run migrations manually:');
    console.log('1. Go to your Supabase Dashboard: https://app.supabase.com');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of each migration file');
    console.log('4. Execute the SQL');
  }
}

main().catch(console.error);
