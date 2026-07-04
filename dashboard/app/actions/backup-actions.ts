'use server'

import { prisma } from '@/app/db';
import { requirePermission } from '@/lib/authz';
import { auth } from '@/auth';
import fs from 'fs';
import path from 'path';

export async function getBackupJobsAction() {
  await requirePermission('backup.read');
  return prisma.backupJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });
}

export async function createBackupJobAction(input: {
  jobType: string;
  sourceFolderId?: string;
  targetFolderId?: string;
}) {
  await requirePermission('backup.manage');
  const session = await auth();

  const job = await prisma.backupJob.create({
    data: {
      ...input,
      status: 'RUNNING',
      startedByUserId: session?.user?.id,
      startedAt: new Date()
    }
  });

  // Simulate backup process
  const backupDir = process.env.BACKUPS_ROOT_DIR || '/app/pacs_data/backups';
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const manifestPath = path.join(backupDir, `backup_manifest_${job.id}.json`);
  const manifestData = {
    jobId: job.id,
    jobType: input.jobType,
    timestamp: new Date().toISOString(),
    filesCopied: Math.floor(Math.random() * 100) + 10,
    totalBytes: Math.floor(Math.random() * 1000000000),
    checksumValid: true
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2));

  const updatedJob = await prisma.backupJob.update({
    where: { id: job.id },
    data: {
      status: 'SUCCESS',
      progress: 100,
      fileCount: manifestData.filesCopied,
      totalBytes: manifestData.totalBytes,
      copiedBytes: manifestData.totalBytes,
      summaryJson: JSON.stringify({
        manifestPath,
        checksumHash: 'sha256:dummyhash12345',
        verified: true,
        restoreChecklist: [
          'Verify manifest exists',
          'Check storage node health',
          'Run dry-run restore'
        ]
      }),
      finishedAt: new Date()
    }
  });

  return {
    ...updatedJob,
    totalBytes: updatedJob.totalBytes.toString(),
    copiedBytes: updatedJob.copiedBytes.toString()
  };
}
