import { prisma } from '../../app/db';

export async function runDicomConformance(userId: string, dicomNodeId?: string) {
  const run = await prisma.dicomConformanceRun.create({
    data: {
      testKey: 'BASIC_ECHO_WADO',
      status: 'RUNNING',
      dicomNodeId: dicomNodeId || null,
      triggeredByUserId: userId,
    }
  });

  const items = [];
  let hasFail = false;

  const start = Date.now();

  try {
    const orthancUrl = process.env.ORTHANC_API_URL;

    if (!orthancUrl) {
      // Missing Orthanc URL, so SKIPPED
      items.push({
        runId: run.id,
        stepKey: 'C-ECHO',
        status: 'SKIPPED',
        message: 'ORTHANC_API_URL not configured'
      });
      items.push({
        runId: run.id,
        stepKey: 'WADO-RS',
        status: 'SKIPPED',
        message: 'ORTHANC_API_URL not configured'
      });
    } else if (dicomNodeId) {
      // Test specific node C-ECHO via Orthanc
      const node = await prisma.dicomNode.findUnique({ where: { id: dicomNodeId } });
      if (!node) throw new Error('DICOM Node not found');

      const echoStart = Date.now();
      const res = await fetch(`${orthancUrl}/modalities/${node.name}/echo`, { method: 'POST' });
      
      if (res.ok) {
        items.push({
          runId: run.id,
          stepKey: 'C-ECHO',
          status: 'SUCCESS',
          message: 'C-ECHO successful',
          durationMs: Date.now() - echoStart
        });
      } else {
        hasFail = true;
        items.push({
          runId: run.id,
          stepKey: 'C-ECHO',
          status: 'FAILED',
          message: `C-ECHO failed with status ${res.status}`,
          durationMs: Date.now() - echoStart
        });
      }
    } else {
      // General DICOM QIDO/WADO endpoint check
      items.push({
        runId: run.id,
        stepKey: 'QIDO-RS',
        status: 'SKIPPED',
        message: 'No specific DICOM node provided, skipping C-ECHO targeted tests',
      });
    }

    // Save items
    if (items.length > 0) {
      await prisma.dicomConformanceRunItem.createMany({ data: items });
    }

    const finalStatus = hasFail ? 'FAILED' : (items.every(i => i.status === 'SKIPPED') ? 'SKIPPED' : 'SUCCESS');
    
    await prisma.dicomConformanceRun.update({
      where: { id: run.id },
      data: {
        status: finalStatus,
        durationMs: Date.now() - start,
      }
    });

    return { id: run.id, status: finalStatus };
  } catch (err: any) {
    await prisma.dicomConformanceRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        errorMessage: err.message,
        durationMs: Date.now() - start,
      }
    });
    throw err;
  }
}

export async function getDicomRuns(take: number = 20) {
  return await prisma.dicomConformanceRun.findMany({
    take,
    orderBy: { createdAt: 'desc' },
    include: {
      triggeredByUser: { select: { username: true, fullName: true } },
      dicomNode: true,
      items: true
    }
  });
}


