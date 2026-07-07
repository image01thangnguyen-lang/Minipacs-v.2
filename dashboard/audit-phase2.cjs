const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Simple taxonomy validator
function validateTaxonomyRule(parentType, childType) {
  if (!parentType) return childType === "CHAIN" || childType === "HOSPITAL";
  const rules = {
    CHAIN: ["HOSPITAL"],
    HOSPITAL: ["DEPARTMENT", "SPECIALTY", "ROOM"],
    DEPARTMENT: ["SPECIALTY", "ROOM"],
    SPECIALTY: ["ROOM"],
    ROOM: []
  };
  return (rules[parentType] || []).includes(childType);
}

async function runAudit() {
  console.log("Starting Phase 2 Audit...");
  const report = [];

  // 1. Audit Facility Unit Types
  const types = await prisma.facilityUnit.groupBy({
    by: ['type'],
    _count: { id: true }
  });
  report.push("=== Facility Unit Types ===");
  types.forEach(t => report.push(`Type: "${t.type}" - Count: ${t._count.id}`));

  // Fetch all units for tree validation
  const units = await prisma.facilityUnit.findMany({
    select: { id: true, type: true, parentId: true, name: true, isActive: true }
  });
  
  const unitMap = new Map(units.map(u => [u.id, u]));
  let orphanParents = 0;
  let taxonomyViolations = 0;
  let cycles = 0;

  report.push("\n=== Organization Tree Integrity ===");
  
  // Check orphans and taxonomy
  for (const unit of units) {
    if (unit.parentId) {
      const parent = unitMap.get(unit.parentId);
      if (!parent) {
        orphanParents++;
        report.push(`Orphan Parent: Unit ${unit.id} ("${unit.name}") has parentId ${unit.parentId} which does not exist.`);
      } else {
        if (!validateTaxonomyRule(parent.type, unit.type)) {
          taxonomyViolations++;
          report.push(`Taxonomy Violation: Unit ${unit.id} ("${unit.type}") under Parent ${parent.id} ("${parent.type}").`);
        }
      }
    } else {
      if (!validateTaxonomyRule(null, unit.type)) {
        taxonomyViolations++;
        report.push(`Taxonomy Violation: Unit ${unit.id} ("${unit.type}") at ROOT level.`);
      }
    }
  }

  // Check cycles
  for (const unit of units) {
    let current = unit;
    const visited = new Set([current.id]);
    while (current && current.parentId) {
      if (visited.has(current.parentId)) {
        cycles++;
        report.push(`Cycle Detected: Node ${current.parentId} is in a cycle (traversing from ${unit.id}).`);
        break;
      }
      visited.add(current.parentId);
      current = unitMap.get(current.parentId);
    }
  }

  report.push(`Summary: ${orphanParents} orphans, ${taxonomyViolations} taxonomy violations, ${cycles} cycle paths detected.`);

  // 2. Audit DicomNode
  const nodes = await prisma.dicomNode.findMany({
    where: { isActive: true },
    select: { id: true, aeTitle: true, name: true, facilityId: true }
  });
  
  const aeTitleMap = {};
  let nodesWithoutFacility = 0;
  
  nodes.forEach(n => {
    if (!n.facilityId) nodesWithoutFacility++;
    if (n.aeTitle) {
      if (!aeTitleMap[n.aeTitle]) aeTitleMap[n.aeTitle] = [];
      aeTitleMap[n.aeTitle].push(n);
    }
  });

  report.push("\n=== Active DicomNodes Without Facility ===");
  report.push(`Found ${nodesWithoutFacility} active machines not linked to any FacilityUnit.`);

  report.push("\n=== Duplicate Active AE Titles ===");
  let hasDups = false;
  for (const [aeTitle, group] of Object.entries(aeTitleMap)) {
    if (group.length > 1) {
      hasDups = true;
      report.push(`AE Title: "${aeTitle}" is used by ${group.length} active nodes:`);
      group.forEach(n => report.push(`  - ID: ${n.id}, Name: ${n.name}, FacilityID: ${n.facilityId || 'None'}`));
    }
  }
  if (!hasDups) {
    report.push("No duplicate AE Titles found among active nodes.");
  }

  // 3. Count machine permissions
  const permCount = await prisma.doctorMachinePermission.count();
  report.push(`\n=== Machine Permissions ===\nTotal legacy permissions to migrate: ${permCount}`);

  const reportPath = path.join(__dirname, 'phase2-audit-report.txt');
  fs.writeFileSync(reportPath, report.join('\n'));
  console.log(`Audit report generated at: ${reportPath}`);

  await prisma.$disconnect();
}

runAudit().catch(e => {
  console.error(e);
  process.exit(1);
});
