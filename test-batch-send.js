const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = new Resend(RESEND_API_KEY);

const testEmails = [
  {
    from: 'Doxa Threads <info@doxa-threads.com>',
    to: 'test@example.com',
    subject: 'Test Email 1',
    html: '<p>Test content 1</p>',
    tags: [
      { name: 'campaign_id', value: 'test123' },
      { name: 'campaign_name', value: 'TestCampaign' },
    ],
  },
  {
    from: 'Doxa Threads <info@doxa-threads.com>',
    to: 'test2@example.com',
    subject: 'Test Email 2',
    html: '<p>Test content 2</p>',
    tags: [
      { name: 'campaign_id', value: 'test123' },
      { name: 'campaign_name', value: 'TestCampaign' },
    ],
  }
];

(async () => {
  console.log('Testing batch send with', testEmails.length, 'emails...\n');
  
  try {
    const result = await resend.batch.send(testEmails);
    console.log('Batch result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
})();
