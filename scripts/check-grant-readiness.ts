import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dashboardRequire = createRequire(path.join(repositoryRoot, "dashboard", "package.json"));
const { PrismaClient } = dashboardRequire("@prisma/client") as typeof import("../dashboard/node_modules/@prisma/client");
const prisma = new PrismaClient();

async function checkReadiness() {
  console.log("=== Phase 2 Scope Authorization Readiness Check ===");

  // 1. Check duplicate AE titles
  const allNodes = await prisma.dicomNode.findMany({
    where: { isActive: true },
    select: { id: true, name: true, aeTitle: true, facilityId: true }
  });

  const aeCounts = new Map<string, string[]>();
  for (const n of allNodes) {
    if (n.aeTitle) {
      const normalizedAeTitle = n.aeTitle.trim().toUpperCase();
      const arr = aeCounts.get(normalizedAeTitle) || [];
      arr.push(n.id);
      aeCounts.set(normalizedAeTitle, arr);
    }
  }

  let duplicates = 0;
  for (const [ae, ids] of aeCounts.entries()) {
    if (ids.length > 1) {
      console.warn(`WARNING: Duplicate AE Title ${ae} exists on ${ids.length} active nodes.`);
      duplicates++;
    }
  }

  if (duplicates === 0) {
    console.log("✅ PASS: No duplicate AE titles found.");
  }

  // 2. Check Unclassified Resources (Study / Order missing performingUnitId)
  const missingStudyUnit = await prisma.imagingStudy.count({
    where: { performingUnitId: null }
  });

  const missingOrderUnit = await prisma.worklistOrder.count({
    where: { performingUnitId: null }
  });

  if (missingStudyUnit > 0) {
    console.warn(`⚠️ WARNING: ${missingStudyUnit} Studies missing performingUnitId.`);
  } else {
    console.log("✅ PASS: All Studies have performingUnitId.");
  }

  if (missingOrderUnit > 0) {
    console.warn(`⚠️ WARNING: ${missingOrderUnit} Orders missing performingUnitId.`);
  } else {
    console.log("✅ PASS: All Orders have performingUnitId.");
  }

  // 3. Output
  if (duplicates === 0 && missingStudyUnit === 0 && missingOrderUnit === 0) {
    console.log("DATA READINESS PASSED. This is one input to approval, not authorization to cut over.");
  } else {
    console.error("DATA READINESS FAILED.");
    console.log("Please clear unclassified queues and resolve AE Title duplicates before full ENFORCE cutover.");
    process.exitCode = 1;
  }
}

checkReadiness()
  .catch((error: unknown) => {
    console.error("Readiness check failed:", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });