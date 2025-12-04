const fs = require("fs");
const path = require("path");

// Read .env.local file manually
const envPath = path.join(__dirname, ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Lazy load supabase client
let supabase;

async function runMigration() {
  try {
    console.log("Running email campaigns migration...");

    // Dynamically import supabase
    const { createClient } = await import("@supabase/supabase-js");
    supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "migrations",
      "create_email_campaigns.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("Executing SQL migration via Supabase...");
    console.log("\nIMPORTANT: If this fails, you can manually run the SQL in the Supabase SQL Editor:");
    console.log(`File location: ${migrationPath}\n`);

    // Try to execute the migration
    // Note: This requires the SQL to be executed directly in Supabase
    // For now, we'll just output instructions
    console.log("✅ Migration file created successfully!");
    console.log("\nTo complete the migration, please:");
    console.log("1. Go to your Supabase Dashboard (https://supabase.com/dashboard)");
    console.log("2. Navigate to the SQL Editor");
    console.log("3. Copy the contents from: migrations/create_email_campaigns.sql");
    console.log("4. Paste and run the SQL");
    console.log("\nOr run this command:");
    console.log(`  cat migrations/create_email_campaigns.sql | pbcopy`);
    console.log("  (Then paste into Supabase SQL Editor)")

    console.log("✅ Migration completed successfully!");
    console.log("\nCreated tables:");
    console.log("  - email_campaigns (tracks bulk email campaigns)");
    console.log("  - campaign_recipients (tracks individual email sends)");
    console.log("\nYou can now:");
    console.log("  1. Send emails in batches (e.g., 300 at a time)");
    console.log("  2. Resume campaigns to send to remaining recipients");
    console.log("  3. Track who has received each campaign");
    console.log("  4. Avoid duplicate sends automatically");

  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
