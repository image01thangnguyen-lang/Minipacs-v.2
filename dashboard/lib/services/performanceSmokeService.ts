import { prisma } from '../../app/db';
import { Prisma } from '@prisma/client';

export async function runPerformanceSmoke(userId: string) {
  const run = await prisma.$transaction(async (tx) => {
    const running = await tx.performanceTestRun.findFirst({ where: { status: 'RUNNING' } });
    if (running) {
      throw new Error('A performance test is already running across the cluster. Try again later.');
    }

    return tx.performanceTestRun.create({
      data: {
        testKey: 'SMOKE_TEST_BASIC',
        status: 'RUNNING',
        triggeredByUserId: userId,
      }
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  try {
    const start = Date.now();
    
    // Hard 30 second timeout for the entire smoke test
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Performance smoke test timed out after 30s')), 30000)
    );

    const testPromise = async () => {
      // 1. Simple DB Query speed test (limited sample size to prevent prod impact)
      const dbStart = Date.now();
      const studies = await prisma.imagingStudy.findMany({ take: 100 });
      const dbDuration = Date.now() - dbStart;

      if (studies.length === 0) {
        return {
          status: 'SKIPPED',
          message: 'Not enough data to run meaningful performance test'
        };
      }

      // Add more checks here later without overloading
      
      return {
        status: 'SUCCESS',
        dbDurationMs: dbDuration,
        studiesChecked: studies.length
      };
    };

    const result: any = await Promise.race([testPromise(), timeoutPromise]);

    const finalStatus = result.status === 'SKIPPED' ? 'SKIPPED' : 'SUCCESS';
    await prisma.performanceTestRun.update({
      where: { id: run.id },
      data: {
        status: finalStatus,
        durationMs: Date.now() - start,
        resultJson: JSON.stringify(result),
        completedAt: new Date()
      }
    });

    return { id: run.id, status: finalStatus };
  } catch (err: any) {
    await prisma.performanceTestRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        errorMessage: err.message,
        completedAt: new Date()
      }
    });
    throw err;
  }
}

export async function getPerformanceRuns(take: number = 20) {
  return await prisma.performanceTestRun.findMany({
    take,
    orderBy: { createdAt: 'desc' },
    include: {
      triggeredByUser: { select: { username: true, fullName: true } }
    }
  });
}


