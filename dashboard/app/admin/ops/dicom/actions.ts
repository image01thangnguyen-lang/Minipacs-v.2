'use server'

import { auth } from '@/auth';
import { requirePermission } from '@/lib/authz';
import { runDicomConformance, getDicomRuns } from '@/lib/services/dicomConformanceService';
import { revalidatePath } from 'next/cache';

export async function runDicomConformanceAction(dicomNodeId?: string) {
  await requirePermission('ops.dicomConformance');
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const result = await runDicomConformance(session.user.id, dicomNodeId);
  revalidatePath('/admin/ops/dicom');
  return result;
}

export async function getDicomRunsAction(take?: number) {
  await requirePermission('ops.dicomConformance');
  return await getDicomRuns(take);
}
