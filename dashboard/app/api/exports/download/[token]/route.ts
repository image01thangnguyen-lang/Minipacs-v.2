import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { createReadStream, statSync, existsSync } from 'fs';
import path from 'path';

// Assuming basic helper for getting auth role/permissions
async function getUserSession() {
  const session = await auth();
  return session;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const session = await getUserSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = params;

    // Ensure token is somewhat safe, assuming we saved plain crypto.randomUUID() into downloadTokenHash in the mock
    const job = await prisma.exportJob.findFirst({
      where: { downloadTokenHash: token },
    });

    if (!job) {
      return NextResponse.json({ error: 'Invalid or expired download link' }, { status: 404 });
    }

    // Permission and ownership checks
    const isOwner = job.requestedByUserId === session.user.id;
    const isManager = hasPermission(session.user.role, 'export.manage', session.user.permissions);

    if (!isOwner && !isManager) {
      // Log access denied
      await prisma.exportAccessLog.create({
        data: {
          exportJobId: job.id,
          actorUserId: session.user.id,
          eventType: 'DOWNLOAD_DENIED',
          ipAddress: request.ip || request.headers.get('x-forwarded-for') || null,
          userAgent: request.headers.get('user-agent') || null,
        }
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Expiry check
    if (job.expiresAt && job.expiresAt < new Date()) {
      await prisma.exportAccessLog.create({
        data: {
          exportJobId: job.id,
          actorUserId: session.user.id,
          eventType: 'EXPIRED_DENIED',
          ipAddress: request.ip || request.headers.get('x-forwarded-for') || null,
          userAgent: request.headers.get('user-agent') || null,
        }
      });
      return NextResponse.json({ error: 'Download link expired' }, { status: 410 });
    }

    // Status check
    if (job.status !== 'SUCCESS') {
      return NextResponse.json({ error: 'Export job not ready' }, { status: 400 });
    }

    // File check
    if (!job.filePath || !existsSync(job.filePath)) {
      return NextResponse.json({ error: 'File not found on server' }, { status: 404 });
    }

    const filePath = job.filePath;
    
    // Path traversal check: must be strictly inside configured storage root
    const validRoot = path.resolve(process.env.EXPORTS_ROOT_DIR || '/app/pacs_data/exports');
    const resolvedPath = path.resolve(filePath);
    
    const relative = path.relative(validRoot, resolvedPath);
    if (relative && relative.startsWith('..') || path.isAbsolute(relative)) {
      return NextResponse.json({ error: 'Invalid file path (Directory traversal detected)' }, { status: 403 });
    }

    const stat = statSync(resolvedPath);
    
    // Use Web Streams API for Next.js response
    const stream = createReadStream(resolvedPath);
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
      cancel() {
        stream.destroy();
      }
    });

    // Log success
    await prisma.exportAccessLog.create({
      data: {
        exportJobId: job.id,
        actorUserId: session.user.id,
        eventType: 'DOWNLOAD_COMPLETED',
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || null,
        userAgent: request.headers.get('user-agent') || null,
      }
    });

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Disposition', `attachment; filename="${job.fileName || 'export.zip'}"`);
    responseHeaders.set('Content-Type', job.mimeType || 'application/octet-stream');
    responseHeaders.set('Content-Length', stat.size.toString());

    return new NextResponse(webStream, { headers: responseHeaders });

  } catch (err: any) {
    console.error('Download route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
