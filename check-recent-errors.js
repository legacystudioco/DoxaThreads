const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  // Get latest campaign
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  console.log('\nCampaign:', campaign.name);
  console.log('Status:', campaign.status);
  console.log('Sent:', campaign.sent_count, '/ Failed:', campaign.failed_count);

  // Get a few failed recipients to see the error
  const { data: failedRecipients } = await supabase
    .from('campaign_recipients')
    .select('email, error_message')
    .eq('campaign_id', campaign.id)
    .eq('status', 'failed')
    .limit(3);

  if (failedRecipients && failedRecipients.length > 0) {
    console.log('\nSample error messages:');
    failedRecipients.forEach((r, i) => {
      console.log(`\n${i + 1}. ${r.email}`);
      console.log('   Error:', r.error_message);
    });
  } else {
    console.log('\nNo failed recipients found');
  }
})();
