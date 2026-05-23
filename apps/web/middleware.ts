import { NextRequest, NextResponse } from 'next/server';

const MOBILE_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

// Paths under /admin that have /m/ equivalents
const MOBILE_ROUTE_MAP: Record<string, string> = {
  '/admin': '/m/dashboard',
  '/admin/pos': '/m/pos',
  '/admin/members': '/m/members',
  '/admin/orders': '/m/orders',
  '/admin/revenue-analytics': '/m/analytics/revenue',
  '/admin/members/analytics': '/m/analytics',
  '/admin/staff-stats': '/m/stats',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only redirect /admin paths (skip /admin/settings, /admin/staff, etc. which have no /m/ equivalent)
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  // Skip if already on a path that has no mobile equivalent
  const mobilePath = MOBILE_ROUTE_MAP[pathname] ?? null;
  if (!mobilePath) return NextResponse.next();

  // Detect mobile device
  const ua = request.headers.get('user-agent') ?? '';
  if (!MOBILE_REGEX.test(ua)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = mobilePath;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*'],
};
