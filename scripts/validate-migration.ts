import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dashboardRequire = createRequire(path.join(repositoryRoot, 'dashboard', 'package.json'));
const { PrismaClient } = dashboardRequire('@prisma/client') as typeof import('../dashboard/node_modules/@prisma/client/index.js');
const prisma = new PrismaClient();

async function run() {
  console.log("Starting Migration Validation for Phase 11...");
  try {
    console.log("Checking Critical Results mapping...");
    const orphanedCriticalResults = await prisma.criticalResult.count({
      where: {
        OR: [
          { reportId: null },
          { reportId: '' },
          { report: { is: null } }
        ]
      }
    });

    if (orphanedCriticalResults > 0) {
      throw new Error(`Found ${orphanedCriticalResults} critical results without a valid report mapping.`);
    } else {
      console.log("SUCCESS: All critical results map to a valid report.");
    }

    console.log("Checking Phase 11 Models existence...");
    const slaCount = await prisma.slaPolicy.count();
    const thresholdCount = await prisma.controlThresholdPolicy.count();
    const alertRuleCount = await prisma.alertRule.count();

    console.log(`Phase 11 metrics found: ${slaCount} SLA Policies, ${thresholdCount} Thresholds, ${alertRuleCount} Alert Rules.`);
    console.log("Migration validation completed successfully.");
    
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error("Migration validation terminated unexpectedly:", error);
  process.exitCode = 1;
});
