import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Don't intercept static assets, next internals, api, storage, or the install page itself
  if (
    pathname.startsWith('/install') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/storage') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  try {
    const apiUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:5060';
    const res = await fetch(`${apiUrl}/api/v1/install/status`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(2000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.data?.is_installed === false) {
        return NextResponse.redirect(new URL('/install', request.url));
      }
    }
  } catch {
    // If API is temporarily booting or unreachable, let request proceed to page
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
