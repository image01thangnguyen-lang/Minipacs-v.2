'use server'

import { prisma } from '@/app/db';
import { requirePermission } from '@/lib/authz';
import { auth } from '@/auth';

export async function getRetentionPoliciesAction() {
  await requirePermission('retention.read');
  return prisma.retentionPolicy.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function createRetentionPolicyAction(input: any) {
  await requirePermission('retention.manage');
  const session = await auth();

  return prisma.retentionPolicy.create({
    data: {
      ...input,
      createdByUserId: session?.user?.id
    }
  });
}

export async function updateRetentionPolicyAction(id: string, input: any) {
  await requirePermission('retention.manage');
  const session = await auth();

  return prisma.retentionPolicy.update({
    where: { id },
    data: {
      ...input,
      updatedByUserId: session?.user?.id
    }
  });
}

export async function deleteRetentionPolicyAction(id: string) {
  await requirePermission('retention.manage');
  return prisma.retentionPolicy.delete({
    where: { id }
  });
}

async function getRetentionProtectionReason(studyInstanceUid: string, policy: any) {
  const report = await prisma.report.findUnique({ where: { studyInstanceUid } });
  if (policy.preserveReports && report && report.status === 'FINAL') {
    return 'Final report is preserved by policy';
  }

  if (policy.preserveKeyImages) {
    const keyImagesCount = await prisma.viewerKeyImage.count({ where: { studyInstanceUid } });
    if (keyImagesCount > 0) return `Study has ${keyImagesCount} saved key images`;
  }

  if (report && (report.hisResultStatus === 'SYNCED' || report.hisResultStatus === 'SENT')) {
    return 'Study result has been sent to HIS';
  }

  const activeConsultations = await prisma.consultation.count({
    where: { studyInstanceUid, status: { in: ['ACTIVE', 'SCHEDULED'] } }
  });
  if (activeConsultations > 0) return `Study has ${activeConsultations} active/scheduled consultations`;

  const activeShares = await prisma.shareLink.count({
    where: { studyInstanceUid, expiresAt: { gt: new Date() } }
  });
  if (activeShares > 0) return `Study has ${activeShares} active share links`;

  return null;
}

export async function getRetentionRunsAction() {
  await requirePermission('retention.read');
  return prisma.retentionRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });
}

export async function dryRunRetentionPolicyAction(policyId: string) {
  await requirePermission('retention.execute');
  const session = await auth();

  const policy = await prisma.retentionPolicy.findUnique({
    where: { id: policyId }
  });

  if (!policy) throw new Error('Policy not found');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - policy.olderThanDays);

  const scanLimit = 100;
  const oldStudies = await prisma.imagingStudy.findMany({
    where: {
      createdAt: { lt: cutoffDate },
      status: { not: 'DELETED_FROM_PACS' },
      ...(policy.modality ? { modality: policy.modality } : {})
    },
    take: scanLimit + 1
  });
  const isTruncated = oldStudies.length > scanLimit;
  const scannedStudies = oldStudies.slice(0, scanLimit);

  const candidateStudies = [];
  for (const s of scannedStudies) {
    const protectionReason = await getRetentionProtectionReason(s.studyInstanceUid, policy);
    if (!protectionReason) candidateStudies.push(s);
  }

  const run = await prisma.retentionRun.create({
    data: {
      policyId,
      mode: 'DRY_RUN',
      status: 'SUCCESS',
      startedByUserId: session?.user?.id,
      candidateCount: candidateStudies.length,
      startedAt: new Date(),
      finishedAt: new Date(),
      errorMessage: isTruncated ? 'Warning: Results truncated to 100 records max' : null
    }
  });

  if (candidateStudies.length > 0) {
    const items = candidateStudies.map(s => ({
      runId: run.id,
      entityType: 'STUDY',
      studyInstanceUid: s.studyInstanceUid,
      action: policy.deletePhysicalFiles ? 'DELETE_FILES' : 'SKIP',
      status: 'PENDING',
      reason: `Older than ${policy.olderThanDays} days & guards passed`
    }));

    await prisma.retentionRunItem.createMany({ data: items });
  }

  return run;
}

export async function executeRetentionRunAction(runId: string, confirmationPhrase: string) {
  await requirePermission('retention.execute');
  const session = await auth();

  const run = await prisma.retentionRun.findUnique({
    where: { id: runId },
    include: { items: true }
  });

  if (!run || run.mode !== 'DRY_RUN') {
    throw new Error('Valid dry run not found');
  }

  if (run.status !== 'SUCCESS') {
    throw new Error('Dry run must be SUCCESS before execution');
  }

  if (confirmationPhrase !== 'I CONFIRM THIS RETENTION RUN') {
    throw new Error('Invalid confirmation phrase');
  }

  if (run.startedByUserId === session?.user?.id) {
    throw new Error('Separation of duties: Cannot execute a retention run you dry-ran');
  }

  const policy = await prisma.retentionPolicy.findUnique({
    where: { id: run.policyId }
  });
  if (!policy) throw new Error('Retention policy not found');

  // Create an EXECUTE run based on this DRY_RUN
  const execRun = await prisma.retentionRun.create({
    data: {
      policyId: run.policyId,
      mode: 'EXECUTE',
      status: 'RUNNING',
      startedByUserId: session?.user?.id,
      candidateCount: run.candidateCount,
      startedAt: new Date(),
    }
  });

  let affectedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const orthancUrl = process.env.ORTHANC_API_URL || 'http://orthanc:8042';
  const orthancAuth = Buffer.from(`${process.env.ORTHANC_USERNAME || 'admin'}:${process.env.ORTHANC_PASSWORD || 'orthanc'}`).toString('base64');

  for (const item of run.items) {
    if (item.entityType === 'STUDY' && item.studyInstanceUid) {
      let success = false;
      let skippedReason: string | null = null;

      const latestProtectionReason = await getRetentionProtectionReason(item.studyInstanceUid, policy);
      if (latestProtectionReason) {
        skippedReason = `Skipped by latest guard: ${latestProtectionReason}`;
      } else if (!policy.deletePhysicalFiles) {
        skippedReason = 'Skipped: policy is configured not to delete physical files';
      }

      if (skippedReason) {
        skippedCount++;
        await prisma.retentionRunItem.create({
          data: {
            runId: execRun.id,
            entityType: item.entityType,
            studyInstanceUid: item.studyInstanceUid,
            action: 'SKIP',
            status: 'SKIPPED',
            reason: skippedReason,
          }
        });
        continue;
      }

      const findRes = await fetch(`${orthancUrl}/tools/find`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${orthancAuth}` },
        body: JSON.stringify({ Level: 'Study', Query: { StudyInstanceUID: item.studyInstanceUid } })
      });

      if (findRes.ok) {
        const findData = await findRes.json();
        if (findData && findData.length > 0) {
          const orthancStudyId = findData[0];
          const delRes = await fetch(`${orthancUrl}/studies/${orthancStudyId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Basic ${orthancAuth}` }
          });
          if (delRes.ok) success = true;
          else failedCount++;
        } else {
          success = true; // Already gone
        }
      } else {
        failedCount++;
      }

      if (success) {
        await prisma.imagingStudy.update({
          where: { studyInstanceUid: item.studyInstanceUid },
          data: { status: 'DELETED_FROM_PACS' }
        }).catch(() => {});
        affectedCount++;
      }

      await prisma.retentionRunItem.create({
        data: {
          runId: execRun.id,
          entityType: item.entityType,
          studyInstanceUid: item.studyInstanceUid,
          action: item.action,
          status: success ? 'SUCCESS' : 'FAILED',
          reason: success ? item.reason : 'Failed to delete from Orthanc',
        }
      });
    }
  }

  await prisma.retentionRun.update({
    where: { id: execRun.id },
    data: {
      status: failedCount > 0 ? 'FAILED' : 'SUCCESS',
      finishedAt: new Date(),
      affectedCount,
      summaryJson: JSON.stringify({ skippedCount, failedCount })
    }
  });

  return execRun;
}
