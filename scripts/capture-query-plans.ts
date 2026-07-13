import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dashboardRequire = createRequire(path.join(repositoryRoot, 'dashboard', 'package.json'));
const { PrismaClient } = dashboardRequire('@prisma/client') as typeof import('../dashboard/node_modules/@prisma/client/index.js');
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

const iterations = Number.parseInt(process.env.PHASE11_LATENCY_ITERATIONS || '20', 10);
const budgetMs = process.env.PHASE11_P95_BUDGET_MS
  ? Number.parseInt(process.env.PHASE11_P95_BUDGET_MS, 10)
  : null;

function percentile(samples: number[], value: number): number {
  const ordered = [...samples].sort((a, b) => a - b);
  return ordered[Math.max(0, Math.ceil(value * ordered.length) - 1)];
}

async function measureQueryLatency(name: string, queryFn: () => Promise<unknown>) {
  await queryFn(); // warm-up; excluded from the baseline
  const samples: number[] = [];
  for (let index = 0; index < iterations; index += 1) {
    const start = process.hrtime.bigint();
    await queryFn();
    samples.push(Number(process.hrtime.bigint() - start) / 1_000_000);
  }
  const p50 = percentile(samples, 0.5);
  const p95 = percentile(samples, 0.95);
  console.log(`[LATENCY] ${name}: n=${iterations} p50=${p50.toFixed(2)}ms p95=${p95.toFixed(2)}ms`);
  if (budgetMs !== null && p95 > budgetMs) {
    throw new Error(`${name} p95 ${p95.toFixed(2)}ms exceeds configured budget ${budgetMs}ms`);
  }
}

async function run() {
  console.log("Capturing baseline latency and query plans for Command Center...");

  if (!Number.isInteger(iterations) || iterations < 2) {
    throw new Error('PHASE11_LATENCY_ITERATIONS must be an integer greater than 1');
  }
  if (budgetMs !== null && (!Number.isFinite(budgetMs) || budgetMs <= 0)) {
    throw new Error('PHASE11_P95_BUDGET_MS must be a positive integer when supplied');
  }

  // Read-only proxy baselines. These are not full SLA/stuck-workflow evaluators.
  await measureQueryLatency('Recent Study Count Proxy', async () => {
    await prisma.imagingStudy.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
  });

  // Measure Alerts Query
  await measureQueryLatency('Active Alerts Query', async () => {
    await prisma.alertEvent.count({
      where: {
        status: 'OPEN'
      }
    });
  });

  // Measure Live Queue (ImagingStudy order by priority/waiting time)
  await measureQueryLatency('Live Queue Query', async () => {
    await prisma.imagingStudy.findMany({
      take: 50,
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        priority: true,
        status: true
      }
    });
  });

  console.log("Done capturing read-only latency baseline. Capture DB-native EXPLAIN plans separately in the target environment.");
}

run()
  .catch((error) => {
    console.error("Baseline capture failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
