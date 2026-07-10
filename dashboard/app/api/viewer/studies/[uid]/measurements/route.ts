import { NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireApiPermission } from '@/lib/api-auth';
import { requireViewerStudyScope } from '@/lib/authz/scope/viewer-scope-helper';

// GET /api/viewer/studies/[uid]/measurements
export async function GET(
  request: Request,
  { params }: { params: { uid: string } }
) {
  try {
    const { uid } = params;
    const authResult = await requireApiPermission('studies.read');

    if (!authResult.ok) {
      return authResult.response;
    }
    const user = authResult.user;

    try {
      await requireViewerStudyScope(uid, "READ_STUDY_ONLY");
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message }, { status: 403 });
    }

    const measurements = await prisma.viewerMeasurement.findMany({
      where: {
        studyInstanceUid: uid,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const formatted = measurements.map(m => {
      let data = {};
      try {
        data = JSON.parse(m.dataJson);
      } catch (e) {
        console.warn(`Failed to parse dataJson for measurement ${m.id}`);
      }

      return {
        id: m.id,
        studyInstanceUid: m.studyInstanceUid,
        seriesInstanceUid: m.seriesInstanceUid,
        sopInstanceUid: m.sopInstanceUid,
        frameNumber: m.frameNumber,
        displaySetInstanceUID: m.displaySetInstanceUID,
        viewportId: m.viewportId,
        toolName: m.toolName,
        measurementType: m.measurementType,
        annotationUID: m.annotationUID,
        measurementUID: m.measurementUID,
        label: m.label,
        value: m.value,
        unit: m.unit,
        data,
      };
    });

    // Record audit: measurements loaded
    await prisma.viewerAuditLog.create({
      data: {
        studyInstanceUid: uid,
        action: 'measurements_loaded',
        actorUserId: user?.id,
        metadataJson: JSON.stringify({ count: measurements.length }),
      },
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching measurements:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/viewer/studies/[uid]/measurements
export async function POST(
  request: Request,
  { params }: { params: { uid: string } }
) {
  try {
    const { uid } = params;
    const authResult = await requireApiPermission('studies.read');

    if (!authResult.ok) {
      return authResult.response;
    }
    const user = authResult.user;

    try {
      await requireViewerStudyScope(uid, "EDIT_CLINICAL");
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message }, { status: 403 });
    }

    const body = await request.json();

    if (body.studyInstanceUid !== uid) {
      return NextResponse.json(
        { success: false, message: 'StudyInstanceUID mismatch' },
        { status: 400 }
      );
    }

    if (!body.toolName || typeof body.toolName !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid toolName' },
        { status: 400 }
      );
    }

    if (body.data && JSON.stringify(body.data).length > 200000) {
      return NextResponse.json(
        { success: false, message: 'Payload size exceeds limit' },
        { status: 400 }
      );
    }

    const measurementUID = body.measurementUID || body.annotationUID;
    if (!measurementUID) {
      return NextResponse.json(
        { success: false, message: 'Invalid measurementUID' },
        { status: 400 }
      );
    }

    const upsertData = {
      studyInstanceUid: uid,
      seriesInstanceUid: body.seriesInstanceUid || null,
      sopInstanceUid: body.sopInstanceUid || null,
      frameNumber: body.frameNumber || null,
      displaySetInstanceUID: body.displaySetInstanceUID || null,
      viewportId: body.viewportId || null,
      toolName: body.toolName,
      measurementType: body.measurementType || null,
      annotationUID: body.annotationUID || null,
      measurementUID: measurementUID,
      label: body.label || null,
      displayText: body.displayText || null,
      value: typeof body.value === 'number' ? body.value : null,
      unit: body.unit || null,
      dataJson: JSON.stringify(body.data || {}),
      isDeleted: false,
    };

    const created = await prisma.viewerMeasurement.upsert({
      where: {
        studyInstanceUid_measurementUID: {
          studyInstanceUid: uid,
          measurementUID: measurementUID,
        }
      },
      create: {
        ...upsertData,
        createdByUserId: user?.id,
      },
      update: {
        ...upsertData,
        updatedByUserId: user?.id,
      }
    });

    // Record audit: measurement created
    await prisma.viewerAuditLog.create({
      data: {
        studyInstanceUid: uid,
        action: 'measurement_created',
        actorUserId: user?.id,
        metadataJson: JSON.stringify({
          measurementId: created.id,
          measurementUID: created.measurementUID,
          toolName: created.toolName,
        }),
      },
    });

    return NextResponse.json({ success: true, id: created.id, data: created });
  } catch (error) {
    console.error('Error creating measurement:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
