import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.password !== password || (user.role !== 'ADMIN' && user.role !== 'RECRUITER')) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set('role', user.role, { httpOnly: true, path: '/' });
  return res;
}
