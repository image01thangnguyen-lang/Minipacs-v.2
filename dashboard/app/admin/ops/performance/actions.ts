'use server'

import { auth } from '@/auth';
import { requirePermission } from '@/lib/authz';
import { runPerformanceSmoke, getPerformanceRuns } from '@/lib/services/performanceSmokeService';
import { revalidatePath } from 'next/cache';

export async function runPerformanceSmokeAction() {
  await requirePermission('ops.performance');
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const result = await runPerformanceSmoke(session.user.id);
  revalidatePath('/admin/ops/performance');
  return result;
}

export async function getPerformanceRunsAction(take?: number) {
  await requirePermission('ops.performance');
  return await getPerformanceRuns(take);
}
