import { scrubDiagnosticOutput } from '../scrubber';
import { prisma } from '../../app/db';

export async function runSecurityAudit(userId: string) {
  const run = await prisma.securityAuditRun.create({
    data: {
      status: 'RUNNING',
      triggeredByUserId: userId,
    }
  });

  const findings = [];
  let hasFail = false;
  let hasWarn = false;

  // 1. Check environment exposure
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    findings.push({
      runId: run.id,
      findingKey: 'non_prod_env',
      severity: 'P2',
      status: 'OPEN',
      title: 'Running in non-production mode',
      description: 'The application is not running in production mode, which may expose debugging information.',
      affectedArea: 'Environment',
      recommendation: 'Set NODE_ENV=production in the deployment environment.',
    });
    hasWarn = true;
  }

  // 2. Check Admin users count
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
  if (adminCount > 3) {
    findings.push({
      runId: run.id,
      findingKey: 'too_many_admins',
      severity: 'P3',
      status: 'OPEN',
      title: 'Too many active administrators',
      description: `There are ${adminCount} active ADMIN users. This increases the attack surface.`,
      affectedArea: 'IAM',
      recommendation: 'Review admin roles and demote unnecessary ones.',
    });
    hasWarn = true;
  }

    // 3. Missing secrets
  if (!process.env.AUTH_SECRET || !process.env.WORKER_SECRET) {
    findings.push({
      runId: run.id,
      findingKey: 'missing_critical_secrets',
      severity: 'P0',
      status: 'OPEN',
      title: 'Missing Critical Secrets',
      description: 'AUTH_SECRET or WORKER_SECRET is not configured properly.',
      affectedArea: 'Configuration',
      recommendation: 'Configure missing secrets immediately to prevent unauthorized access.',
    });
    hasFail = true;
  }

  // 4. Public share risks
  if (!process.env.PUBLIC_SHARE_MAX_EXPIRY_DAYS) {
    findings.push({
      runId: run.id,
      findingKey: 'public_share_risks',
      severity: 'P1',
      status: 'OPEN',
      title: 'Public Share Link Policy',
      description: 'No expiration policy enforced for public share links (PUBLIC_SHARE_MAX_EXPIRY_DAYS is not set).',
      affectedArea: 'Data Sharing',
      recommendation: 'Configure a maximum expiry time for share links (e.g., 7 days).',
    });
    hasWarn = true;
  }
  
  // 5. Destructive guardrails
  if (process.env.REQUIRE_TWO_PERSON_DELETE !== 'true') {
    findings.push({
      runId: run.id,
      findingKey: 'destructive_guardrails',
      severity: 'P1',
      status: 'OPEN',
      title: 'Destructive Operations Guardrails',
      description: 'Bulk deletion is not protected by a secondary approver (REQUIRE_TWO_PERSON_DELETE is not true).',
      affectedArea: 'Data Safety',
      recommendation: 'Enable two-person rule for bulk deletions.',
    });
    hasWarn = true;
  }

  // Save findings
  if (findings.length > 0) {
    await prisma.securityAuditFinding.createMany({
      data: findings
    });
  }

  // Update run
  const finalStatus = hasFail ? 'FAIL' : (hasWarn ? 'WARN' : 'OK');
  await prisma.securityAuditRun.update({
    where: { id: run.id },
    data: {
      status: finalStatus,
      finishedAt: new Date(),
    }
  });

  return { id: run.id, status: finalStatus };
}

export async function getSecurityFindings(take: number = 50) {
  return await prisma.securityAuditFinding.findMany({
    take,
    orderBy: { createdAt: 'desc' },
    include: {
      run: true,
      resolvedByUser: { select: { username: true, fullName: true } }
    }
  });
}

export async function resolveSecurityFinding(findingId: string, userId: string, action: 'FIXED' | 'ACCEPTED_RISK') {
  return await prisma.securityAuditFinding.update({
    where: { id: findingId },
    data: {
      status: action,
      resolvedByUserId: userId,
      resolvedAt: new Date(),
    }
  });
}

// Ensure Audit Explorer doesn't return raw data
export async function getScrubbedAuditLogs(take: number = 50) {
  const logs = await prisma.auditLog.findMany({
    take,
    orderBy: { createdAt: 'desc' },
    include: { actor: { select: { username: true } } }
  });

  return logs.map((log: any) => {
    // Return safe data only
    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      createdAt: log.createdAt,
      user: log.actor,
      // intentionally exclude raw metadataJson or use scrubber
      safeMetadata: (() => { try { return scrubDiagnosticOutput(log.metadataJson ? JSON.parse(log.metadataJson) : null); } catch { return { error: 'Invalid JSON metadata' }; } })()
    };
  });
}

