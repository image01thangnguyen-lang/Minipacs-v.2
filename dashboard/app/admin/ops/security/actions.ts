'use server'

import { auth } from '@/auth';
import { requirePermission } from '@/lib/authz';
import { runSecurityAudit, getSecurityFindings, resolveSecurityFinding, getScrubbedAuditLogs } from '@/lib/services/securityAuditService';
import { revalidatePath } from 'next/cache';

export async function runSecurityAuditAction() {
  await requirePermission('ops.security');
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const result = await runSecurityAudit(session.user.id);
  revalidatePath('/admin/ops/security');
  return result;
}

export async function getSecurityFindingsAction(take?: number) {
  await requirePermission('ops.security');
  return await getSecurityFindings(take);
}

export async function resolveSecurityFindingAction(findingId: string, action: 'FIXED' | 'ACCEPTED_RISK') {
  await requirePermission('ops.security.resolve');
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const result = await resolveSecurityFinding(findingId, session.user.id, action);
  revalidatePath('/admin/ops/security');
  return result;
}

export async function getScrubbedAuditLogsAction(take?: number) {
  await requirePermission('system.audit');
  return await getScrubbedAuditLogs(take);
}
