import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/api-auth';
import { prisma } from '@/app/db';

export async function GET(request: Request, { params }: { params: { filename: string } }) {
  const authz = await requireApiPermission('viewer.export');
  if (!authz.ok) return authz.response;

  const userId = authz.user.id;
  const filename = params.filename;

  // Find job associated with this mock file to check ownership
  const job = await prisma.viewerDownloadJob.findFirst({
    where: { fileName: filename }
  });

  if (!job) {
    return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
  }

  if (job.requestedByUserId !== userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized access to file' }, { status: 403 });
  }

  // Mock file download
  const mockContent = 'This is a mock DICOM export zip file content.';
  const headers = new Headers();
  headers.set('Content-Type', 'application/zip');
  headers.set('Content-Disposition', `attachment; filename="${filename}"`);

  return new NextResponse(mockContent, { status: 200, statusText: "OK", headers });
}
