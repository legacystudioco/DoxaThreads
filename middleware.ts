import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths to exclude from tracking
const EXCLUDED_PATHS = [
  '/api/',
  '/_next/',
  '/assets/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/wp-admin/',
  '/wordpress/wp-admin/',
  '/studio/', // Don't track admin visits
];

// Generate a session ID from visitor fingerprint
function generateSessionId(req: NextRequest): string {
  const ip = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const timestamp = Math.floor(Date.now() / (1000 * 60 * 30)); // 30-minute windows
  
  // Simple hash function
  const str = `${ip}-${userAgent}-${timestamp}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip tracking for excluded paths
  const shouldSkip = EXCLUDED_PATHS.some(path => pathname.startsWith(path));
  const isAssetRequest = pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|css|js)$/i);
  
  if (!shouldSkip && !isAssetRequest) {
    // Track visitor asynchronously (don't await to avoid slowing down requests)
    trackVisitor(req).catch(err => {
      console.error('Visitor tracking error:', err);
    });
  }

  return NextResponse.next();
}

async function trackVisitor(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return; // Skip tracking if env vars not set
    }

    const ip = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    const userAgent = req.headers.get('user-agent') || null;
    const referrer = req.headers.get('referer') || null;
    const sessionId = generateSessionId(req);

    // Get geolocation data from Vercel headers or Cloudflare headers
    const city = req.headers.get('x-vercel-ip-city') || req.geo?.city || null;
    const region = req.headers.get('x-vercel-ip-country-region') || req.geo?.region || null;
    const country = req.headers.get('x-vercel-ip-country') || req.geo?.country || null;
    const latitude = req.headers.get('x-vercel-ip-latitude') || req.geo?.latitude || null;
    const longitude = req.headers.get('x-vercel-ip-longitude') || req.geo?.longitude || null;

    const visitorData = {
      session_id: sessionId,
      page_path: req.nextUrl.pathname,
      referrer: referrer,
      user_agent: userAgent,
      ip_address: ip,
      city: city,
      region: region,
      country: country,
      country_code: country,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    };

    // Insert into Supabase
    await fetch(`${supabaseUrl}/rest/v1/visitor_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Prefer': 'return=minimal', // Don't return the inserted row
      },
      body: JSON.stringify(visitorData),
    });
  } catch (error) {
    // Silently fail - we don't want tracking errors to break the site
    console.error('Failed to track visitor:', error);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
