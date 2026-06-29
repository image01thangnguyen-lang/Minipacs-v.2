import { NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireApiPermission } from '@/lib/api-auth';

// PATCH /api/viewer/studies/[uid]/measurements/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { uid: string; id: string } }
) {
  try {
    const { uid, id } = params;
    const authResult = await requireApiPermission('studies.read');

    if (!authResult.ok) {
      return authResult.response;
    }
    const user = authResult.user;

    // `id` is the measurementUID (the cornerstone annotation UID)
    const existing = await prisma.viewerMeasurement.findFirst({
      where: {
        studyInstanceUid: uid,
        measurementUID: id,
        isDeleted: false,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Measurement not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    if (body.data && JSON.stringify(body.data).length > 200000) {
      return NextResponse.json(
        { success: false, message: 'Payload size exceeds limit' },
        { status: 400 }
      );
    }

    const updated = await prisma.viewerMeasurement.update({
      where: { id: existing.id },
      data: {
        seriesInstanceUid: body.seriesInstanceUid !== undefined ? body.seriesInstanceUid : existing.seriesInstanceUid,
        sopInstanceUid: body.sopInstanceUid !== undefined ? body.sopInstanceUid : existing.sopInstanceUid,
        frameNumber: body.frameNumber !== undefined ? body.frameNumber : existing.frameNumber,
        displaySetInstanceUID: body.displaySetInstanceUID !== undefined ? body.displaySetInstanceUID : existing.displaySetInstanceUID,
        viewportId: body.viewportId !== undefined ? body.viewportId : existing.viewportId,
        label: body.label !== undefined ? body.label : existing.label,
        displayText: body.displayText !== undefined ? body.displayText : existing.displayText,
        value: typeof body.value === 'number' ? body.value : existing.value,
        unit: body.unit !== undefined ? body.unit : existing.unit,
        dataJson: body.data ? JSON.stringify(body.data) : existing.dataJson,
        updatedByUserId: user?.id,
      },
    });

    // Record audit: measurement updated
    await prisma.viewerAuditLog.create({
      data: {
        studyInstanceUid: uid,
        action: 'measurement_updated',
        actorUserId: user?.id,
        metadataJson: JSON.stringify({
          measurementId: existing.id,
          measurementUID: existing.measurementUID,
          toolName: existing.toolName,
        }),
      },
    });

    return NextResponse.json({ success: true, id: updated.id });
  } catch (error) {
    console.error('Error updating measurement:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/viewer/studies/[uid]/measurements/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { uid: string; id: string } }
) {
  try {
    const { uid, id } = params;
    const authResult = await requireApiPermission('studies.read');

    if (!authResult.ok) {
      return authResult.response;
    }
    const user = authResult.user;

    // `id` is the measurementUID
    const existing = await prisma.viewerMeasurement.findFirst({
      where: {
        studyInstanceUid: uid,
        measurementUID: id,
        isDeleted: false,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Measurement not found' },
        { status: 404 }
      );
    }

    await prisma.viewerMeasurement.update({
      where: { id: existing.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedByUserId: user?.id,
      },
    });

    // Record audit: measurement deleted
    await prisma.viewerAuditLog.create({
      data: {
        studyInstanceUid: uid,
        action: 'measurement_deleted',
        actorUserId: user?.id,
        metadataJson: JSON.stringify({
          measurementId: existing.id,
          measurementUID: existing.measurementUID,
          toolName: existing.toolName,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting measurement:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
