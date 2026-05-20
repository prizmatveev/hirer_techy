import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  return NextResponse.json(await prisma.job.update({ where: { id: params.id }, data }));
}
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.job.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
