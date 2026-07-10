import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/app/db';
import { hasPermission } from '@/lib/permissions';
import { requireViewerStudyScope } from '@/lib/authz/scope/viewer-scope-helper';
import { escapeHtml } from '@/lib/viewer-measurement-summary';

export async function POST(request: Request, { params }: { params: { uid: string } }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'Ban chua dang nhap.' }, { status: 401 });
  }

  try {
    await requireViewerStudyScope(params.uid, "DRAFT_REPORT");
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 403 });
  }

  try {
    const studyInstanceUid = params.uid;
    const body = await request.json();
    const { imageIds, mode } = body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json({ success: false, message: 'Khong co anh nao duoc chon.' }, { status: 400 });
    }

    const report = await prisma.report.findUnique({
      where: { studyInstanceUid }
    });

    if (report && ['FINAL', 'PENDING_APPROVAL'].includes(report.status)) {
      return NextResponse.json({ 
        success: false, 
        requiresAddendum: true, 
        message: 'Bao cao da hoan thanh, khong the ghi de.' 
      });
    }

    // Fetch key images and snapshots
    const keyImages = await prisma.viewerKeyImage.findMany({
      where: { studyInstanceUid, id: { in: imageIds } }
    });
    
    const snapshots = await prisma.viewerSnapshot.findMany({
      where: { studyInstanceUid, id: { in: imageIds } }
    });

    if (keyImages.length === 0 && snapshots.length === 0) {
      return NextResponse.json({ success: false, message: 'Khong tim thay thong tin anh.' }, { status: 404 });
    }

    let formattedLines = [];
    keyImages.forEach(ki => {
      formattedLines.push(`Key image: ${ki.note || 'Khong co nhan'} (Series ${ki.seriesInstanceUid?.slice(-5) || '?'})`);
    });
    snapshots.forEach(sn => {
      formattedLines.push(`Snapshot: ${sn.note || 'Khong co nhan'} (Series ${sn.seriesInstanceUid?.slice(-5) || '?'})`);
    });

    const newSectionContent = `[VIEWER_IMAGES_START]\n<p><strong>Anh/Snapshot tu Viewer:</strong></p>\n<ul>\n${formattedLines.map(line => `<li>${escapeHtml(line)}</li>`).join('\n')}\n</ul>\n[VIEWER_IMAGES_END]`;

    let newFindings = report?.findings || '';
    
    if (mode === 'replace_image_section' && newFindings.includes('[VIEWER_IMAGES_START]')) {
      const regex = /\[VIEWER_IMAGES_START\][\s\S]*?\[VIEWER_IMAGES_END\]/;
      newFindings = newFindings.replace(regex, newSectionContent);
    } else {
      newFindings = newFindings + (newFindings ? '\n\n' : '') + newSectionContent;
    }

    if (report) {
      await prisma.report.update({
        where: { id: report.id },
        data: { findings: newFindings }
      });
    } else {
      const study = await prisma.imagingStudy.findUnique({
        where: { studyInstanceUid }
      });
      await prisma.report.create({
        data: {
          studyInstanceUid,
          imagingStudyId: study?.id,
          status: 'DRAFT',
          findings: newFindings,
          doctorId: session.user.id
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'key_images_sent_to_report',
        entityType: 'Study',
        entityId: studyInstanceUid,
        metadataJson: JSON.stringify({ imageCount: formattedLines.length }),
      }
    });

    return NextResponse.json({ success: true, message: 'Da cap nhat anh vao bao cao thanh cong.' });
  } catch (error) {
    console.error('Failed to send key images to report:', error);
    return NextResponse.json({ success: false, message: 'Loi he thong.' }, { status: 500 });
  }
}
