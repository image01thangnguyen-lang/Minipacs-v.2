import { scrubDiagnosticOutput } from '../scrubber';
import { prisma } from '../../app/db';

export async function runHealthCheck(userId: string, trigger: string = 'MANUAL') {
  const run = await prisma.systemHealthCheckRun.create({
    data: {
      status: 'RUNNING',
      trigger,
      triggeredByUserId: userId,
    }
  });

  const items = [];
  let hasFail = false;
  let hasWarn = false;

  // 1. Database Check
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    items.push({
      runId: run.id,
      checkKey: 'db_connection',
      category: 'DATABASE',
      status: 'OK',
      message: 'Database connection successful',
      durationMs: Date.now() - dbStart,
    });
  } catch (err: any) {
    hasFail = true;
    items.push({
      runId: run.id,
      checkKey: 'db_connection',
      category: 'DATABASE',
      status: 'FAIL',
      message: 'Database connection failed',
      metadataJson: JSON.stringify(scrubDiagnosticOutput({ error: err.message })),
      durationMs: 0,
    });
  }

  // 2. Orthanc Check
  try {
    const orthancStart = Date.now();
    const orthancUrl = process.env.ORTHANC_API_URL;
    if (!orthancUrl) {
      items.push({
        runId: run.id,
        checkKey: 'orthanc_connection',
        category: 'PACS',
        status: 'SKIPPED',
        message: 'ORTHANC_API_URL not configured in environment',
        durationMs: 0,
      });
    } else {
      const res = await fetch(`${orthancUrl}/system`);
      if (!res.ok) throw new Error(`Orthanc returned HTTP ${res.status}`);
      items.push({
        runId: run.id,
        checkKey: 'orthanc_connection',
        category: 'PACS',
        status: 'OK',
        message: 'Orthanc is reachable and responding',
        durationMs: Date.now() - orthancStart,
      });
    }
  } catch (err: any) {
    hasFail = true;
    items.push({
      runId: run.id,
      checkKey: 'orthanc_connection',
      category: 'PACS',
      status: 'FAIL',
      message: 'Orthanc connection failed',
      metadataJson: JSON.stringify(scrubDiagnosticOutput({ error: err.message })),
      durationMs: 0,
    });
  }

  // 3. Storage Check (Skipped as we don't have direct disk access info right now)
  items.push({
    runId: run.id,
    checkKey: 'storage_rw',
    category: 'STORAGE',
    status: 'SKIPPED',
    message: 'Storage read/write check not implemented',
    durationMs: 0,
  });

  // Save items
  await prisma.systemHealthCheckItem.createMany({
    data: items
  });

  // Update run
  const finalStatus = hasFail ? 'FAIL' : (hasWarn ? 'WARN' : 'OK');
  await prisma.systemHealthCheckRun.update({
    where: { id: run.id },
    data: {
      status: finalStatus,
      finishedAt: new Date(),
    }
  });

  return { id: run.id, status: finalStatus };
}

export async function getHealthRuns(take: number = 20) {
  return await prisma.systemHealthCheckRun.findMany({
    take,
    orderBy: { startedAt: 'desc' },
    include: {
      triggeredByUser: { select: { username: true, fullName: true } },
      items: true
    }
  });
}


