import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { access, readFile } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';

const toPublicResumePath = (resume: string) => {
  const normalized = resume.trim().replace(/\\/g, '/').replace(/^\.\//, '').replace(/^public\//, '');
  if (normalized.startsWith('/')) return normalized;
  if (normalized.startsWith('uploads/')) return `/${normalized}`;
  return `/uploads/resumes/${normalized.split('/').pop() ?? normalized}`;
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
  if (resume.startsWith('http://') || resume.startsWith('https://')) {
    return NextResponse.redirect(resume);
  }

  const publicPath = toPublicResumePath(resume);
  const diskPath = join(process.cwd(), 'public', publicPath.replace(/^\//, ''));

  try {
    await access(diskPath, constants.R_OK);
  } catch {
    return NextResponse.json({ error: 'Resume file is missing on server storage.' }, { status: 404 });
  }

  const file = await readFile(diskPath);
  return new NextResponse(file, {
    headers: {
      'Content-Type': mimeFromPath(publicPath),
      'Content-Disposition': `inline; filename="${publicPath.split('/').pop() || 'resume'}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
