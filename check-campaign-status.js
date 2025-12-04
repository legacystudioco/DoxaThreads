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

async function checkCampaignStatus() {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking latest campaign status...\n");

    // Get the latest campaign
    const { data: campaigns, error: campaignError } = await supabase
      .from("email_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (campaignError) {
      console.error("Error fetching campaign:", campaignError);
      return;
    }

    if (!campaigns || campaigns.length === 0) {
      console.log("No campaigns found");
      return;
    }

    const campaign = campaigns[0];
    console.log("Campaign:", campaign.name);
    console.log("Status:", campaign.status);
    console.log("Total Recipients:", campaign.total_recipients);
    console.log("Sent:", campaign.sent_count);
    console.log("Failed:", campaign.failed_count);
    console.log("\nChecking recipient records...\n");

    // Get recipient records
    const { data: recipients, error: recipientsError } = await supabase
      .from("campaign_recipients")
      .select("*")
      .eq("campaign_id", campaign.id)
      .limit(10);

    if (recipientsError) {
      console.error("Error fetching recipients:", recipientsError);
      return;
    }

    if (!recipients || recipients.length === 0) {
      console.log("No recipient records found - this is the problem!");
      console.log("The insert may have failed.");
      return;
    }

    console.log(`Found ${recipients.length} recipient records:`);
    recipients.forEach((r, i) => {
      console.log(`\n${i + 1}. ${r.email}`);
      console.log(`   Status: ${r.status}`);
      if (r.error_message) {
        console.log(`   Error: ${r.error_message}`);
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

checkCampaignStatus();
