import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { status, note } = await req.json();
  const app = await prisma.application.update({ where: { id: params.id }, data: { status } });
  if (note) await prisma.adminNotes.create({ data: { applicationId: params.id, note } });
  return NextResponse.json(app);
}
