import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(_req: NextRequest) {
  // TEMP: disable all studio-route auth redirects to prevent loops while we debug client sessions
  return NextResponse.next();
}

export const config = {
  matcher: ['/studio/:path*'],
};
