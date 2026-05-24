import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

type ApplicationResumeRecord = {
  id: string;
  resume: string | null;
  resumeFileUrl: string | null;
  resumeFileKey: string | null;
};

// Hirer + Recruit share a single UploadThing project/storage bucket. We only use
// UploadThing for resume binary storage and keep all other application data in PostgreSQL.
const UPLOADTHING_HOST_PATTERNS = [
  /uploadthing\.com$/i,
  /ufs\.sh$/i,
  /utfs\.io$/i,
];

const isValidHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

const isLikelyUploadThingKey = (value: string) => /^[A-Za-z0-9/_\-.]{8,300}$/.test(value);

const isLikelyUploadThingUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return UPLOADTHING_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname));
  } catch {
    return false;
  }
};

const getFilename = (key: string | null, fallback = 'resume.pdf') => {
  if (!key) return fallback;
  const leaf = key.split('/').pop()?.trim();
  return leaf || fallback;
};

const getApplicationResumeRecord = async (applicationId: string): Promise<ApplicationResumeRecord | null> => {
  try {
    const rows = await prisma.$queryRawUnsafe<ApplicationResumeRecord[]>(
      'SELECT "id", "resume", "resumeFileUrl", "resumeFileKey" FROM "Application" WHERE "id" = $1 LIMIT 1',
      applicationId,
    );
    return rows[0] ?? null;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Prisma.PrismaClientUnknownRequestError) {
      console.warn(`[resume] appId=${applicationId} storage=postgres_columns_unavailable details=resumeFileUrl/resumeFileKey columns unavailable`);
      const legacy = await prisma.application.findUnique({ where: { id: applicationId }, select: { id: true, resume: true } });
      if (!legacy) return null;
      return { id: legacy.id, resume: legacy.resume, resumeFileUrl: null, resumeFileKey: null };
    }

    throw error;
  }
};

const fetchUploadThingFile = async (url: string) => fetch(url, { cache: 'no-store' });

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const requestUrl = new URL(req.url);
  const asDownload = requestUrl.searchParams.get('download') === '1';
  const appId = params.id;

  const application = await getApplicationResumeRecord(appId);
  if (!application) {
    console.info(`[resume] appId=${appId} storage=not_found result=application_missing`);
    return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  }

  const resumeFileUrl = application.resumeFileUrl?.trim() || '';
  const resumeFileKey = application.resumeFileKey?.trim() || '';

  if (!resumeFileUrl || !resumeFileKey) {
    const legacyResume = application.resume?.trim() || '';
    if (legacyResume && isValidHttpUrl(legacyResume)) {
      console.warn(`[resume] appId=${appId} storage=legacy_url_fallback result=redirecting_legacy_url`);
      return NextResponse.redirect(legacyResume);
    }

    console.warn(`[resume] appId=${appId} storage=uploadthing_missing_fields result=missing_url_or_key`);
    return NextResponse.json(
      { error: 'Resume is not available in UploadThing storage for this application.' },
      { status: 404 },
    );
  }

  if (!isValidHttpUrl(resumeFileUrl) || !isLikelyUploadThingUrl(resumeFileUrl)) {
    console.warn(`[resume] appId=${appId} storage=uploadthing_invalid_url result=validation_failed url=${resumeFileUrl}`);
    return NextResponse.json({ error: 'Resume UploadThing URL is invalid.' }, { status: 422 });
  }

  if (!isLikelyUploadThingKey(resumeFileKey)) {
    console.warn(`[resume] appId=${appId} storage=uploadthing_invalid_key result=validation_failed key=${resumeFileKey}`);
    return NextResponse.json({ error: 'Resume UploadThing file key is invalid.' }, { status: 422 });
  }

  const upstream = await fetchUploadThingFile(resumeFileUrl);
  if (!upstream.ok) {
    console.error(`[resume] appId=${appId} storage=uploadthing status=${upstream.status} result=fetch_failed`);
    return NextResponse.json(
      { error: upstream.status === 404 ? 'Resume file has been deleted from UploadThing.' : 'Failed to fetch resume file from UploadThing.' },
      { status: upstream.status === 404 ? 404 : 502 },
    );
  }

  const upstreamContentType = upstream.headers.get('content-type') || 'application/octet-stream';
  const filename = getFilename(resumeFileKey, upstreamContentType.includes('pdf') ? 'resume.pdf' : 'resume');
  const disposition = asDownload ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`;

  console.info(`[resume] appId=${appId} storage=uploadthing result=fetch_success mode=${asDownload ? 'download' : 'preview'} contentType=${upstreamContentType}`);

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstreamContentType,
      'Content-Disposition': disposition,
      'Cache-Control': 'private, no-store',
      'X-Resume-Storage': 'uploadthing',
    },
  });
}
