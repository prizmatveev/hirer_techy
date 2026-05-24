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

const shouldForceAdminOnly = () => normalize(process.env.ADMIN_ONLY_MODE ?? 'true') !== 'false';

const parseAdminHost = () => {
  const configured = normalize(process.env.ADMIN_APP_HOST ?? '');
  if (!configured || configured === '0' || configured === 'false' || configured === 'null' || configured === 'undefined' || configured === '*' || configured === 'any' || configured === 'all') {
    return '';
  }
  return configured;
};

const isAdminHost = (req: NextRequest) => {
  if (!shouldForceAdminOnly()) return false;

  const configured = parseAdminHost();
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

const isAllowedInAdminOnlyMode = (pathname: string) => {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return true;
  if (pathname.startsWith('/api/admin/')) return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname === '/favicon.ico') return true;
  if (pathname.startsWith('/images/')) return true;
  if (pathname.startsWith('/fonts/')) return true;
  return false;
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isAdminHost(req)) {
    return NextResponse.next();
  }

  if (!isAllowedInAdminOnlyMode(pathname)) {
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
