'use server'

import { prisma } from '@/app/db';
import { requirePermission } from '@/lib/authz';
import { auth } from '@/auth';
import { processExportJob } from '@/lib/export-worker';
import { requireScopedStudyRead } from '@/lib/authz/scope/require-scoped-access';

export async function createExportJobAction(input: {
  jobType: string;
  scope: string;
  studyInstanceUid?: string;
  seriesInstanceUid?: string;
  reportId?: string;
  nonDicomExamId?: string;
  filterJson?: string;
  selectedItemsJson?: string;
  anonymize?: boolean;
  includePatientInfo?: boolean;
  format: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Basic permissions
  if (input.anonymize) {
    await requirePermission('export.anonymize');
  } else if (input.scope === 'ARCHIVE_BULK') {
    await requirePermission('export.bulk');
  } else {
    await requirePermission('export.create');
  }

  // Prevent spoofing by verifying resource exists and scope is allowed
  if (input.studyInstanceUid) {
    await requireScopedStudyRead({
      userId: session.user.id,
      studyInstanceUid: input.studyInstanceUid,
    });
  }

  if (input.reportId) {
    const report = await prisma.report.findUnique({ where: { id: input.reportId } });
    if (!report) throw new Error('Report not found');
    await requireScopedStudyRead({
      userId: session.user.id,
      studyInstanceUid: report.studyInstanceUid,
    });
  }

  // Handle bulk export items filtering based on scope
  let finalSelectedItemsJson = input.selectedItemsJson;
  if (input.scope === 'ARCHIVE_BULK' && input.selectedItemsJson) {
    try {
      const uids = JSON.parse(input.selectedItemsJson);
      if (Array.isArray(uids)) {
        const allowedUids = [];
        for (const uid of uids) {
          if (typeof uid === 'string') {
            try {
              await requireScopedStudyRead({ userId: session.user.id, studyInstanceUid: uid });
              allowedUids.push(uid);
            } catch (err) {
              // Ignore denied items for bulk
            }
          }
        }
        if (allowedUids.length === 0) {
          throw new Error('Bạn không có quyền tải xuống bất kỳ ca chụp nào đã chọn');
        }
        finalSelectedItemsJson = JSON.stringify(allowedUids);
      }
    } catch (err: any) {
      if (err.message.includes('quyền')) throw err;
      throw new Error('Invalid selectedItemsJson format');
    }
  }

  const job = await prisma.exportJob.create({
    data: {
      ...input,
      selectedItemsJson: finalSelectedItemsJson,
      status: 'PENDING',
      requestedByUserId: session.user.id,
      progress: 0,
      itemCount: 0,
    }
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: 'EXPORT_JOB_CREATED',
      entityType: 'ExportJob',
      entityId: job.id,
      metadataJson: JSON.stringify(input)
    }
  });

  // Trigger worker asynchronously without awaiting
  processExportJob(job.id).catch(console.error);

  return serializeJob(job);
}

function serializeJob(job: any) {
  return {
    ...job,
    fileSizeBytes: job.fileSizeBytes ? job.fileSizeBytes.toString() : null
  };
}

export async function getMyExportJobsAction() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const jobs = await prisma.exportJob.findMany({
    where: {
      requestedByUserId: session.user.id
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  });

  return jobs.map(serializeJob);
}

export async function cancelExportJobAction(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const job = await prisma.exportJob.findUnique({
    where: { id: jobId }
  });

  if (!job) throw new Error('Not found');

  if (job.requestedByUserId !== session.user.id) {
    await requirePermission('export.manage');
  }

  if (job.status === 'SUCCESS' || job.status === 'FAILED' || job.status === 'CANCELLED' || job.status === 'EXPIRED') {
    throw new Error('Cannot cancel a finished job');
  }

  const updated = await prisma.exportJob.update({
    where: { id: jobId },
    data: { status: 'CANCELLED', completedAt: new Date() }
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: 'EXPORT_JOB_CANCELLED',
      entityType: 'ExportJob',
      entityId: job.id
    }
  });

  return serializeJob(updated);
}
