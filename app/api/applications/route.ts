import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json();
  const { jobId, fullName, email, phone, location, experience, currentCompany, expectedSalary, coverLetter, linkedin, github, portfolio, resume } = body;
  if (!jobId || !fullName || !email || !phone || !linkedin || !github) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: fullName },
    create: { name: fullName, email, role: 'CANDIDATE' },
  });

  const application = await prisma.application.create({
    data: {
      userId: user.id,
      jobId,
      phone,
      location: location || null,
      yearsExperience: experience || null,
      currentCompany: currentCompany || null,
      expectedSalary: expectedSalary || null,
      coverLetter: coverLetter || null,
      linkedin,
      github,
      portfolio: portfolio || null,
      resume: resume || 'resume-upload-pending',
      status: 'PENDING',
    },
  });

  return NextResponse.json({ ok: true, applicationId: application.id });
}
