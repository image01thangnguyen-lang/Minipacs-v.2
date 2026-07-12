'use server'

import { prisma } from '@/app/db';
import { requirePermission } from '@/lib/authz';
import { auth } from '@/auth';

export async function getDestructiveRequestsAction() {
  await requirePermission('destructive.audit');
  return prisma.destructiveOperationRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });
}

export async function createDestructiveRequestAction(input: {
  operationType: string;
  entityType: string;
  entityId?: string;
  studyInstanceUid?: string;
  reason: string;
}) {
  await requirePermission('destructive.request');
  const session = await auth();

  const req = await prisma.destructiveOperationRequest.create({
    data: {
      ...input,
      status: 'REQUESTED',
      requestedByUserId: session?.user?.id,
    }
  });

  return req;
}

async function buildDeleteStudyImpactSummary(studyInstanceUid: string) {
  const impactSummary: any = { safeToDelete: true, warnings: [] };

  const study = await prisma.imagingStudy.findUnique({
    where: { studyInstanceUid }
  });

  if (!study) {
    impactSummary.safeToDelete = false;
    impactSummary.warnings.push('Study was not found in the local database.');
    return impactSummary;
  }

  const report = await prisma.report.findUnique({ where: { studyInstanceUid } });
  if (report && report.status === 'FINAL') {
    impactSummary.safeToDelete = false;
    impactSummary.warnings.push('Study has a FINALIZED report.');
  }

  if (report && (report.hisResultStatus === 'SYNCED' || report.hisResultStatus === 'SENT')) {
    impactSummary.safeToDelete = false;
    impactSummary.warnings.push('Study result is already synced to HIS.');
  }

  const activeConsultations = await prisma.consultation.count({
    where: { studyInstanceUid, status: { in: ['ACTIVE', 'SCHEDULED'] } }
  });
  if (activeConsultations > 0) {
    impactSummary.safeToDelete = false;
    impactSummary.warnings.push(`Study has ${activeConsultations} active/scheduled consultations.`);
  }

  const activeShares = await prisma.shareLink.count({
    where: { studyInstanceUid, expiresAt: { gt: new Date() } }
  });
  if (activeShares > 0) {
    impactSummary.safeToDelete = false;
    impactSummary.warnings.push(`Study has ${activeShares} active share links.`);
  }

  const keyImagesCount = await prisma.viewerKeyImage.count({ where: { studyInstanceUid } });
  if (keyImagesCount > 0) {
    impactSummary.safeToDelete = false;
    impactSummary.warnings.push(`Study has ${keyImagesCount} saved key images.`);
  }

  const measurementsCount = await prisma.viewerMeasurement.count({ where: { studyInstanceUid } });
  if (measurementsCount > 0) {
    impactSummary.safeToDelete = false;
    impactSummary.warnings.push(`Study has ${measurementsCount} saved measurements.`);
  }

  return impactSummary;
}

export async function approveDestructiveRequestAction(id: string) {
  await requirePermission('destructive.approve');
  const session = await auth();

  const req = await prisma.destructiveOperationRequest.findUnique({
    where: { id }
  });

  if (!req) throw new Error('Not found');

  if (req.requestedByUserId === session?.user?.id) {
    throw new Error('Separation of duties: Cannot approve your own request');
  }

  if (req.status !== 'DRY_RUN_READY') {
    throw new Error('Invalid status for approval. Must perform dry run first.');
  }

  const impactSummary = req.impactSummaryJson ? JSON.parse(req.impactSummaryJson) : null;
  if (impactSummary && impactSummary.safeToDelete === false) {
    throw new Error('Cannot approve: Dry run indicates it is NOT safe to delete.');
  }

  const updated = await prisma.destructiveOperationRequest.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedByUserId: session?.user?.id,
      approvedAt: new Date()
    }
  });

  return updated;
}

export async function dryRunDestructiveRequestAction(id: string) {
  await requirePermission('destructive.request');
  const session = await auth();

  const req = await prisma.destructiveOperationRequest.findUnique({
    where: { id }
  });

  if (!req) throw new Error('Not found');

  let impactSummary: any = { safeToDelete: false, warnings: ['Unsupported destructive operation.'] };

  if (req.operationType === 'DELETE_STUDY' && req.studyInstanceUid) {
    impactSummary = await buildDeleteStudyImpactSummary(req.studyInstanceUid);
  }

  const updated = await prisma.destructiveOperationRequest.update({
    where: { id },
    data: {
      status: 'DRY_RUN_READY',
      impactSummaryJson: JSON.stringify(impactSummary)
    }
  });

  return updated;
}

export async function executeDestructiveRequestAction(id: string, confirmationPhrase: string) {
  await requirePermission('destructive.execute');
  const session = await auth();

  const req = await prisma.destructiveOperationRequest.findUnique({
    where: { id }
  });

  if (!req) throw new Error('Not found');

  if (req.status !== 'APPROVED') {
    throw new Error('Request must be approved first');
  }

  if (req.requestedByUserId === session?.user?.id) {
    throw new Error('Separation of duties: Cannot execute your own request');
  }

  if (confirmationPhrase !== 'I CONFIRM THIS DESTRUCTIVE ACTION') {
    throw new Error('Invalid confirmation phrase');
  }

  const impactSummary = req.impactSummaryJson ? JSON.parse(req.impactSummaryJson) : null;
  if (impactSummary && impactSummary.safeToDelete === false) {
    throw new Error('Cannot execute: Dry run indicates it is NOT safe to delete. Final report exists.');
  }

  // Actively delete from Orthanc
  if (req.operationType === 'DELETE_STUDY' && req.studyInstanceUid) {
    const latestImpact = await buildDeleteStudyImpactSummary(req.studyInstanceUid);
    if (!latestImpact.safeToDelete) {
      await prisma.destructiveOperationRequest.update({
        where: { id },
        data: { status: 'DRY_RUN_READY', impactSummaryJson: JSON.stringify(latestImpact) }
      });
      throw new Error('Cannot execute: latest safety check is no longer safe. Please review the updated dry-run result.');
    }

    const study = await prisma.imagingStudy.findUnique({
      where: { studyInstanceUid: req.studyInstanceUid }
    });

    if (study) {
      const orthancUrl = process.env.ORTHANC_API_URL || 'http://orthanc:8042';
      const orthancAuth = Buffer.from(`${process.env.ORTHANC_USERNAME || 'admin'}:${process.env.ORTHANC_PASSWORD || 'orthanc'}`).toString('base64');

      // Find Orthanc Study ID
      const findRes = await fetch(`${orthancUrl}/tools/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${orthancAuth}`
        },
        body: JSON.stringify({ Level: 'Study', Query: { StudyInstanceUID: req.studyInstanceUid } })
      });

      if (findRes.ok) {
        const findData = await findRes.json();
        if (findData && findData.length > 0) {
          const orthancStudyId = findData[0];
          // Issue DELETE
          const delRes = await fetch(`${orthancUrl}/studies/${orthancStudyId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Basic ${orthancAuth}` }
          });
          if (!delRes.ok) {
            throw new Error(`Orthanc deletion failed with status: ${delRes.status}`);
          }
        }
      } else {
        throw new Error('Failed to query Orthanc for deletion');
      }

      // Record Audit
      await prisma.viewerAuditLog.create({
        data: {
          studyInstanceUid: req.studyInstanceUid,
          action: 'STUDY_PHYSICALLY_DELETED',
          actorUserId: session?.user?.id,
          metadataJson: JSON.stringify({ reason: req.reason, request: id })
        }
      });

      // Update local DB status and clear related entities
      await prisma.imagingStudy.update({
        where: { studyInstanceUid: req.studyInstanceUid },
        data: { status: 'DELETED_FROM_PACS' }
      });
      // (Optionally cascade delete ViewerKeyImages, ViewerMeasurements if strict physical cleanup is required locally,
      // but marking status might be enough for the DB to orphan them)
    }
  }

  const updated = await prisma.destructiveOperationRequest.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      executedByUserId: session?.user?.id,
      executedAt: new Date(),
      confirmationPhrase
    }
  });

  return updated;
}
