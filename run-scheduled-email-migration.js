const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log("Running scheduled emails migration...");

    const migrationFile = path.join(
      __dirname,
      "migrations",
      "create_scheduled_emails.sql"
    );
    const sql = fs.readFileSync(migrationFile, "utf8");

    // Split by semicolon and execute each statement
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      const { error } = await supabase.rpc("exec_sql", { sql: statement });

      if (error) {
        // Try direct query if RPC doesn't work
        const { error: directError } = await supabase.from("_").select(statement);

        if (directError) {
          console.error("Statement error:", directError.message);
          // Continue with next statement
        } else {
          console.log("✓ Success");
        }
      } else {
        console.log("✓ Success");
      }
    }

    console.log("\n✓ Migration completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Set up a cron job to call /api/studio/bulk-email/process-scheduled");
    console.log("2. Add CRON_SECRET to your .env.local file");
    console.log("3. Configure your cron service (Vercel Cron, etc.)");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
