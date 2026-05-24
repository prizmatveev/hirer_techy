import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { access, readFile } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

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
    return NextResponse.json({ error: 'Resume not found for this application.' }, { status: 404 });
  }

  const resume = application.resume;
  const inline = fromDataUrl(resume);
  if (inline) {
    return new NextResponse(inline.bytes, {
      headers: {
        'Content-Type': inline.mime,
        'Content-Disposition': 'inline; filename="resume"',
        'Cache-Control': 'private, no-store',
      },
    });
  }

  if (resume.startsWith('http://') || resume.startsWith('https://')) {
    return NextResponse.redirect(resume);
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
    return NextResponse.json({ error: 'Resume file is missing on server storage.' }, { status: 404 });
  }

  const file = await readFile(resolvedDiskPath);
  const publicPath = toDecodedPath(resume);
  return new NextResponse(file, {
    headers: {
      'Content-Type': mimeFromPath(publicPath),
      'Content-Disposition': `inline; filename="${publicPath.split('/').pop() || 'resume'}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
