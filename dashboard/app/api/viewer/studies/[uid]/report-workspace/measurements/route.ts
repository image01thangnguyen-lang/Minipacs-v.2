import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/app/db';
import { hasPermission } from '@/lib/permissions';
import { formatMeasurementSummary, escapeHtml } from '@/lib/viewer-measurement-summary';

export async function POST(request: Request, { params }: { params: { uid: string } }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'Ban chua dang nhap.' }, { status: 401 });
  }

  if (!hasPermission(session.user.role, 'reports.write', session.user.permissions)) {
    return NextResponse.json({ success: false, message: 'Ban khong co quyen sua bao cao.' }, { status: 403 });
  }

  try {
    const studyInstanceUid = params.uid;
    const body = await request.json();
    const { measurementUIDs, mode } = body;

    if (!Array.isArray(measurementUIDs) || measurementUIDs.length === 0) {
      return NextResponse.json({ success: false, message: 'Khong co do dac nao duoc chon.' }, { status: 400 });
    }

    const report = await prisma.report.findUnique({
      where: { studyInstanceUid }
    });

    if (report && ['FINAL', 'PENDING_APPROVAL'].includes(report.status)) {
      // Logic for addendum or fallback text
      const fallbackText = "Bao cao da hoan thanh, khong the ghi de. Vui long tao phu luc/addendum.";
      
      await prisma.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: 'report_addendum_suggested_from_viewer',
          entityType: 'Study',
          entityId: studyInstanceUid,
          metadataJson: JSON.stringify({ measurementUIDs }),
        }
      });

      return NextResponse.json({ 
        success: false, 
        requiresAddendum: true, 
        message: fallbackText 
      });
    }

    // Fetch measurements
    const viewerMeasurements = await prisma.viewerMeasurement.findMany({
      where: { 
        studyInstanceUid, 
        measurementUID: { in: measurementUIDs },
        isDeleted: false 
      }
    });

    if (viewerMeasurements.length === 0) {
      return NextResponse.json({ success: false, message: 'Khong tim thay thong tin do dac.' }, { status: 404 });
    }

    const formattedLines = viewerMeasurements
      .map(formatMeasurementSummary)
      .filter(m => m.isSafeForReport)
      .map(m => m.summaryText);

    if (formattedLines.length === 0) {
      return NextResponse.json({ success: false, message: 'Cac do dac da chon khong du an toan de dua vao bao cao.' }, { status: 400 });
    }

    const newSectionContent = `[VIEWER_MEASUREMENTS_START]\n<p><strong>Do dac tu Viewer:</strong></p>\n<ul>\n${formattedLines.map(line => `<li>${escapeHtml(line.replace(/^- /, ''))}</li>`).join('\n')}\n</ul>\n[VIEWER_MEASUREMENTS_END]`;

    let newFindings = report?.findings || '';
    
    if (mode === 'replace_measurement_section' && newFindings.includes('[VIEWER_MEASUREMENTS_START]')) {
      const regex = /\[VIEWER_MEASUREMENTS_START\][\s\S]*?\[VIEWER_MEASUREMENTS_END\]/;
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
      // Find study to link
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
        action: 'report_draft_updated_from_viewer',
        entityType: 'Study',
        entityId: studyInstanceUid,
        metadataJson: JSON.stringify({ measurementCount: formattedLines.length }),
      }
    });

    return NextResponse.json({ success: true, message: 'Da cap nhat bao cao thanh cong.' });
  } catch (error) {
    console.error('Failed to send measurements to report:', error);
    return NextResponse.json({ success: false, message: 'Loi he thong.' }, { status: 500 });
  }
}
