'use server'

import { requirePermission } from '@/lib/authz';
import { getDeploymentReadiness } from '@/lib/services/deploymentReadinessService';

export async function getDeploymentReadinessAction() {
  await requirePermission('ops.deployment');
  return await getDeploymentReadiness();
}
