import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { name, email, password } = await req.json();
  if (!name || !email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  const user = await prisma.user.create({ data: { name, email, password, role: 'ADMIN' } });
  return NextResponse.json({ id: user.id, email: user.email });
}
