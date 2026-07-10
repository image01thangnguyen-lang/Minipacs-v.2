import { migrateLegacyPermissionsToGrants, createRootCompatibilityGrants } from "./legacy-migration";
import { prisma } from "../../../../app/db";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function run(name: string, test: () => Promise<void> | void) {
  try {
    await test();
    console.log(`✅ PASS: ${name}`);
  } catch (error) {
    console.error(`❌ FAIL: ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

console.log("--- legacy-migration ---");

(async () => {
  await run("migrateLegacyPermissionsToGrants - idempotency", async () => {
    // Mock data
    const legacyPerms = [
      { doctorId: "doc1", dicomNodeId: "node1", actionKey: "READ_STUDY", allow: true },
      { doctorId: "doc1", dicomNodeId: "node2", actionKey: "INVALID_KEY", allow: true },
      { doctorId: "doc1", dicomNodeId: "node3", actionKey: "EDIT_CLINICAL", allow: false },
    ];

    let existingGrants: any[] = [];
    let createdGrants: any[] = [];

    (prisma as any).doctorMachinePermission = {
      findMany: async () => legacyPerms,
    };

    (prisma as any).accessScopeGrant = {
      findMany: async () => existingGrants,
      create: async (args: any) => {
        createdGrants.push(args.data);
        existingGrants.push(args.data);
        return args.data;
      },
    };

    // Run first time
    const res1 = await migrateLegacyPermissionsToGrants();
    assert(res1.migratedCount === 2, "Should migrate both valid permissions");
    assert(res1.skippedCount === 1, "Should skip only the invalid capability");
    assert(createdGrants.length === 2, "Should create 2 grants");

    // Run second time (should be idempotent)
    createdGrants.length = 0; // reset
    const res2 = await migrateLegacyPermissionsToGrants();
    assert(res2.migratedCount === 0, "Should migrate 0 on second run");
    assert(res2.skippedCount === 3, "Should skip the invalid capability and 2 existing grants");
    assert(createdGrants.length === 0, "Should create 0 grants on second run");
  });

  await run("createRootCompatibilityGrants - roles and users", async () => {
    let createdGrants: any[] = [];
    
    (prisma as any).appRoleProfile = {
      findMany: async () => [
        { id: "role1", isActive: true, baseRole: "DOCTOR", permissions: ["studies.read"] },
      ]
    };

    (prisma as any).user = {
      findMany: async () => [
        { id: "admin1", isActive: true, role: "ADMIN", roleProfile: null },
        { id: "doctor1", isActive: true, role: "DOCTOR", roleProfile: null },
      ],
      findUnique: async () => ({ id: "doc1", isActive: true, role: "DOCTOR" }) // for dual-write test
    };

    (prisma as any).accessScopeGrant = {
      findMany: async () => [], // No existing grants
      create: async (args: any) => {
        createdGrants.push(args.data);
        return args.data;
      },
    };

    const res = await createRootCompatibilityGrants();
    assert(res.rolesMigrated === 1, "Should migrate 1 role capability");
    
    // ADMIN user should get all capabilities. There are 20 capabilities mapped.
    assert(res.usersMigrated > 10, "Should migrate all capabilities for ADMIN");

    // Verify created grant for role
    const roleGrant = createdGrants.find(g => g.roleProfileId === "role1");
    assert(roleGrant.capability === "READ_STUDY", "Role should get READ_STUDY");
    assert(roleGrant.includeDescendants === true, "Root grant should include descendants");

    const doctorGrant = createdGrants.find(g => g.userId === "doctor1" && g.capability === "READ_STUDY");
    assert(Boolean(doctorGrant), "User without profile should receive effective base-role grants");
  });
})();


