'use server'

import { auth } from '@/auth';
import { requirePermission } from '@/lib/authz';
import { runHealthCheck, getHealthRuns } from '@/lib/services/systemHealthService';
import { revalidatePath } from 'next/cache';

export async function runSystemHealthCheckAction() {
  await requirePermission('ops.health.run');
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const result = await runHealthCheck(session.user.id, 'MANUAL');
  revalidatePath('/admin/ops/health');
  return result;
}

export async function getHealthRunsAction(take?: number) {
  await requirePermission('ops.health');
  return await getHealthRuns(take);
}
