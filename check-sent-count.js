const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  console.log('\nCampaign:', campaign.name);
  console.log('Dashboard shows sent:', campaign.sent_count);
  
  const { data: sentRecipients, count } = await supabase
    .from('campaign_recipients')
    .select('*', { count: 'exact' })
    .eq('campaign_id', campaign.id)
    .eq('status', 'sent');
  
  console.log('Actually sent in database:', count);
  console.log('\nNext batch will skip these', count, 'people and send to the next', campaign.max_per_batch, 'contacts.\n');
})();
