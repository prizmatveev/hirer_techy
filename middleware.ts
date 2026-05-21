import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const normalize = (value: string) => value.trim().toLowerCase();

const parseHost = (raw: string | null | undefined) => {
  if (!raw) return '';
  return normalize(raw.split(',')[0] ?? '');
};

const hostMatches = (candidate: string, configured: string) => {
  if (!candidate || !configured) return false;
  if (candidate === configured) return true;

  const candidateHostname = candidate.split(':')[0] ?? candidate;
  const configuredHostname = configured.split(':')[0] ?? configured;
  return candidateHostname === configuredHostname;
};

const isAdminHost = (req: NextRequest) => {
  const configured = normalize(process.env.ADMIN_APP_HOST ?? '');
  if (!configured) return true;

  const forwardedHost = parseHost(req.headers.get('x-forwarded-host'));
  const requestHost = normalize(req.nextUrl.host);
  const requestHostname = normalize(req.nextUrl.hostname);

  return (
    hostMatches(forwardedHost, configured) ||
    hostMatches(requestHost, configured) ||
    hostMatches(requestHostname, configured)
  );
};

const isPublicAsset = (pathname: string) => {
  if (pathname.startsWith('/_next/')) return true;
  if (pathname === '/favicon.ico') return true;
  if (pathname.startsWith('/images/')) return true;
  if (pathname.startsWith('/fonts/')) return true;
  if (pathname.startsWith('/api/admin/')) return true;
  return false;
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isAdminHost(req)) {
    const blockedAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');
    if (blockedAdminPath) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  if (!isAdminPage && !isPublicAsset(pathname)) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  if (pathname.startsWith('/admin/dashboard')) {
    const role = req.cookies.get('role')?.value;
    if (role !== 'ADMIN' && role !== 'RECRUITER') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!.*\\..*).*)', '/api/:path*'] };
