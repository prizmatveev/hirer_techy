import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_INLINE_RESUME_BYTES = 2 * 1024 * 1024;

const toDataUrl = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = Buffer.from(arrayBuffer);
  if (bytes.byteLength > MAX_INLINE_RESUME_BYTES) {
    throw new Error('Resume file is too large for inline storage. Keep it under 2MB.');
  }
  const mime = file.type || 'application/octet-stream';
  return `data:${mime};base64,${bytes.toString('base64')}`;
};

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const jobId = String(form.get('jobId') || '');
    const fullName = String(form.get('fullName') || '').trim();
    const email = String(form.get('email') || '').trim().toLowerCase();
    const phone = String(form.get('phone') || '').trim();
    const location = String(form.get('location') || '').trim();
    const experience = String(form.get('experience') || '').trim();
    const currentCompany = String(form.get('currentCompany') || '').trim();
    const linkedin = String(form.get('linkedin') || '').trim();
    const github = String(form.get('github') || '').trim();
    const portfolio = String(form.get('portfolio') || '').trim();
    const expectedSalary = String(form.get('expectedSalary') || '').trim();
    const coverLetter = String(form.get('coverLetter') || '').trim();
    const resume = form.get('resume');

    if (!jobId || !fullName || !email || !phone || !linkedin || !github || !(resume instanceof File)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const resumeDataUrl = await toDataUrl(resume);

    const user = await prisma.user.upsert({
      where: { email },
      update: { name: fullName },
      create: { name: fullName, email, role: 'CANDIDATE' },
    });

    const application = await prisma.application.create({
      data: {
        userId: user.id,
        jobId,
        resume: resumeDataUrl,
        linkedin,
        github,
        portfolio: portfolio || null,
        phone,
        location: location || null,
        yearsExperience: experience || null,
        currentCompany: currentCompany || null,
        expectedSalary: expectedSalary || null,
        coverLetter: coverLetter || null,
      },
    });

    return NextResponse.json({ ok: true, id: application.id });
  } catch (error) {
    console.error('Application submit failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to submit application' }, { status: 500 });
  }
}
