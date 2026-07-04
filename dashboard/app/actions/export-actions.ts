'use server'

import { prisma } from '@/app/db';
import { requirePermission } from '@/lib/authz';
import { auth } from '@/auth';
import { processExportJob } from '@/lib/export-worker';

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

  // Prevent spoofing by verifying resource exists
  if (input.studyInstanceUid) {
    const study = await prisma.imagingStudy.findUnique({
      where: { studyInstanceUid: input.studyInstanceUid }
    });
    if (!study) throw new Error('Study not found');
  }

  if (input.reportId) {
    const report = await prisma.report.findUnique({ where: { id: input.reportId } });
    if (!report) throw new Error('Report not found');
  }

  // Assuming NonDicomExam exists if there's a schema for it
  // if (input.nonDicomExamId) { ... }

  const job = await prisma.exportJob.create({
    data: {
      ...input,
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
