import { NextRequest, NextResponse } from "next/server";
import { getRates } from "@/lib/shippo";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Test endpoint to diagnose Shippo issues
 * Access at: /api/test-shippo
 */
export async function GET(req: NextRequest) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Shippo Diagnostics</title>
  <style>
    body { font-family: monospace; padding: 20px; max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; }
    .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 10px; margin: 10px 0; }
    .error { background: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; margin: 10px 0; }
    .info { background: #d1ecf1; border: 1px solid #bee5eb; padding: 10px; margin: 10px 0; }
    pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
    button { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; margin: 5px; }
    button:hover { background: #0056b3; }
    #results { margin-top: 20px; }
  </style>
</head>
<body>
  <h1>🚢 Shippo API Diagnostics</h1>
  
  <div class="info">
    <strong>Purpose:</strong> Test if your Shippo account is properly configured and returning shipping rates.
  </div>

  <h2>Test Configuration</h2>
  <button onclick="testShippo()">🧪 Run Test</button>
  <button onclick="document.getElementById('results').innerHTML = ''">Clear Results</button>

  <div id="results"></div>

  <script>
    async function testShippo() {
      const results = document.getElementById('results');
      results.innerHTML = '<div class="info">⏳ Testing Shippo API...</div>';

      try {
        const res = await fetch('/api/test-shippo/run');
        const data = await res.json();

        let html = '';
        
        if (data.success) {
          html += '<div class="success">✅ <strong>SUCCESS</strong> - Shippo API is working!</div>';
          html += '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          
          if (data.rates && data.rates.length > 0) {
            html += '<h3>Available Rates:</h3>';
            data.rates.forEach((rate, idx) => {
              html += \`
                <div class="info">
                  <strong>\${idx + 1}. \${rate.provider} - \${rate.service}</strong><br>
                  Amount: $\${rate.amount}<br>
                  Rate ID: \${rate.rateId}<br>
                  Estimated Days: \${rate.days || 'N/A'}
                </div>
              \`;
            });
          }
        } else {
          html += '<div class="error">❌ <strong>ERROR</strong> - Shippo API failed</div>';
          html += '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          
          html += '<div class="error">';
          html += '<h3>Possible Solutions:</h3>';
          html += '<ul>';
          html += '<li>Login to <a href="https://goshippo.com" target="_blank">Shippo Dashboard</a></li>';
          html += '<li>Verify USPS carrier account is connected</li>';
          html += '<li>Check that you\\'re not in test mode</li>';
          html += '<li>Ensure your payment method is set up</li>';
          html += '<li>Verify API token has correct permissions</li>';
          html += '</ul>';
          html += '</div>';
        }

        results.innerHTML = html;
      } catch (error) {
        results.innerHTML = \`
          <div class="error">
            ❌ <strong>EXCEPTION</strong><br>
            <pre>\${error.message}</pre>
          </div>
        \`;
      }
    }
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}
