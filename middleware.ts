import { NextResponse } from 'next/server';import type { NextRequest } from 'next/server';
export function middleware(req:NextRequest){if(req.nextUrl.pathname.startsWith('/admin/dashboard')){const role=req.cookies.get('role')?.value;if(role!=='ADMIN'&&role!=='RECRUITER')return NextResponse.redirect(new URL('/admin/login',req.url));}return NextResponse.next();}
export const config={matcher:['/admin/:path*']};
