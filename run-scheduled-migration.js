const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  try {
    console.log("🚀 Running scheduled emails migration...\n");

    const migrationFile = path.join(
      __dirname,
      "migrations",
      "create_scheduled_emails.sql"
    );
    const sql = fs.readFileSync(migrationFile, "utf8");

    // For Supabase, we need to run this via the SQL editor or use their API
    console.log("📝 SQL Migration Content:");
    console.log("─".repeat(60));
    console.log(sql);
    console.log("─".repeat(60));
    console.log("\n⚠️  Note: You need to run this SQL in your Supabase dashboard.\n");
    console.log("Steps:");
    console.log("1. Go to: https://supabase.com/dashboard/project/njdmmnvdjoawckvoxcxd/sql/new");
    console.log("2. Copy the SQL above");
    console.log("3. Paste it into the SQL Editor");
    console.log("4. Click 'Run'\n");

    // Test connection
    console.log("🔍 Testing Supabase connection...");
    const { data, error } = await supabase.from("newsletter_subscribers").select("id").limit(1);

    if (error) {
      console.error("❌ Connection test failed:", error.message);
    } else {
      console.log("✅ Supabase connection successful!\n");
    }

    console.log("💡 After running the SQL, you can verify with:");
    console.log("   SELECT * FROM scheduled_emails LIMIT 1;");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

runMigration();
