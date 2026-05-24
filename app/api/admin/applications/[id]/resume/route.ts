import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { access, readFile } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

type ResumeAssetRow = {
  data: Buffer | Uint8Array;
  fileName: string | null;
  contentType: string | null;
};

const toPublicResumePath = (resume: string) => {
  const normalized = resume.trim().replace(/\\/g, '/').replace(/^\.\//, '').replace(/^public\//, '');
  if (normalized.startsWith('/')) return normalized;
  if (normalized.startsWith('uploads/')) return `/${normalized}`;
  return `/uploads/resumes/${normalized.split('/').pop() ?? normalized}`;
};

const toDecodedPath = (resume: string) => {
  try {
    const parsed = new URL(resume);
    return decodeURIComponent(parsed.pathname);
  } catch {
    const withoutQuery = resume.split('?')[0]?.split('#')[0] ?? resume;
    return decodeURIComponent(withoutQuery);
  }
};

const toCandidateDiskPaths = (resume: string) => {
  const decodedPath = toDecodedPath(resume).replace(/^\/+/, '');
  const fileName = decodedPath.split('/').pop() ?? '';

  const candidates = [
    decodedPath,
    toPublicResumePath(decodedPath).replace(/^\//, ''),
    fileName ? `uploads/resumes/${fileName}` : '',
    fileName ? `uploads/${fileName}` : '',
  ]
    .filter(Boolean)
    .map((relative) => join(process.cwd(), 'public', relative));

  return [...new Set(candidates)];
};


const fromDataUrl = (value: string) => {
  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1] || 'application/octet-stream';
  const bytes = Buffer.from(match[2], 'base64');
  return { mime, bytes };
};

const fromRawBase64 = (value: string) => {
  const sanitized = value.trim();
  if (!sanitized || sanitized.includes('\\') || /\s/.test(sanitized)) return null;
  if (!/^[A-Za-z0-9+/=]+$/.test(sanitized) || sanitized.length < 32) return null;

  try {
    const bytes = Buffer.from(sanitized, 'base64');
    if (!bytes.length) return null;
    const pdfSignature = bytes.subarray(0, 4).toString('utf8') === '%PDF';
    return { mime: pdfSignature ? 'application/pdf' : 'application/octet-stream', bytes };
  } catch {
    return null;
  }
};

const isUrlValue = (value: string) => /^https?:\/\//i.test(value.trim());

const isExplicitLocalPath = (value: string) => {
  const v = value.trim();
  return /^\.?\.?\//.test(v)
    || /^public\//i.test(v)
    || /^uploads\//i.test(v)
    || /^file:\/\//i.test(v)
    || /^[a-zA-Z]:\\/.test(v);
};

const findResumeAsset = async (applicationId: string): Promise<ResumeAssetRow | null> => {
  try {
    const rows = await prisma.$queryRawUnsafe<ResumeAssetRow[]>(
      'SELECT "data", "fileName", "contentType" FROM "ResumeAsset" WHERE "applicationId" = $1 LIMIT 1',
      applicationId,
    );
    return rows[0] ?? null;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Prisma.PrismaClientUnknownRequestError) {
      console.info('[resume] mode=resume_asset_lookup_unavailable');
      return null;
    }
    console.error('[resume] mode=resume_asset_lookup_failed', error);
    return null;
  }
};

const mimeFromPath = (path: string) => {
  const ext = path.toLowerCase().split('.').pop() ?? '';
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'txt': return 'text/plain; charset=utf-8';
    case 'rtf': return 'application/rtf';
    case 'odt': return 'application/vnd.oasis.opendocument.text';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'bmp': return 'image/bmp';
    case 'tif':
    case 'tiff': return 'image/tiff';
    case 'svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
};

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const application = await prisma.application.findUnique({ where: { id: params.id }, select: { resume: true } });
  if (!application?.resume) {
    const resumeAsset = await findResumeAsset(params.id);
    if (resumeAsset?.data) {
      const bytes = Buffer.isBuffer(resumeAsset.data) ? resumeAsset.data : Buffer.from(resumeAsset.data);
      console.info('[resume] mode=resume_asset_only');
      return new NextResponse(bytes, {
        headers: {
          'Content-Type': resumeAsset.contentType || 'application/pdf',
          'Content-Disposition': `inline; filename="${resumeAsset.fileName || 'resume.pdf'}"`,
          'Cache-Control': 'private, no-store',
        },
      });
    }
    console.info('[resume] mode=not_found');
    return NextResponse.json({ error: 'Resume not found for this application.' }, { status: 404 });
  }

  const resume = application.resume;
  const inline = fromDataUrl(resume);
  if (inline) {
    console.info('[resume] mode=data_url');
    return new NextResponse(inline.bytes, {
      headers: {
        'Content-Type': inline.mime,
        'Content-Disposition': 'inline; filename="resume"',
        'Cache-Control': 'private, no-store',
      },
    });
  }

  const rawBase64 = fromRawBase64(resume);
  if (rawBase64) {
    console.info('[resume] mode=raw_base64');
    return new NextResponse(rawBase64.bytes, {
      headers: {
        'Content-Type': rawBase64.mime,
        'Content-Disposition': 'inline; filename="resume"',
        'Cache-Control': 'private, no-store',
      },
    });
  }

  if (isUrlValue(resume)) {
    console.info('[resume] mode=external_url');
    return NextResponse.redirect(resume);
  }

  const resumeAsset = await findResumeAsset(params.id);
  if (resumeAsset?.data) {
    const bytes = Buffer.isBuffer(resumeAsset.data) ? resumeAsset.data : Buffer.from(resumeAsset.data);
    console.info('[resume] mode=resume_asset');
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': resumeAsset.contentType || 'application/pdf',
        'Content-Disposition': `inline; filename="${resumeAsset.fileName || 'resume.pdf'}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  }

  if (!isExplicitLocalPath(resume)) {
    console.info('[resume] mode=unrecognized_non_path');
    return NextResponse.json({ error: 'Resume format is not a supported path or inline document.' }, { status: 404 });
  }

  const candidateDiskPaths = toCandidateDiskPaths(resume);
  let resolvedDiskPath: string | null = null;

  for (const candidate of candidateDiskPaths) {
    try {
      await access(candidate, constants.R_OK);
      resolvedDiskPath = candidate;
      break;
    } catch {
      // try next candidate
    }
  }

  if (!resolvedDiskPath) {
    console.info('[resume] mode=filesystem_not_found');
    return NextResponse.json({ error: 'Resume file is missing on server storage.' }, { status: 404 });
  }

  const file = await readFile(resolvedDiskPath);
  const publicPath = toDecodedPath(resume);
  console.info('[resume] mode=filesystem_path');
  return new NextResponse(file, {
    headers: {
      'Content-Type': mimeFromPath(publicPath),
      'Content-Disposition': `inline; filename="${publicPath.split('/').pop() || 'resume'}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
