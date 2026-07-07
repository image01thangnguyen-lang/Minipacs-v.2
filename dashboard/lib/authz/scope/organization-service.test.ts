import { OrganizationService } from "./organization-service";
import { prisma } from "../../../app/db";
import { OrganizationIntegrityError } from "./organization-tree";

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

console.log("--- organization-service ---");

// We overwrite the imported prisma instance directly for testing
let mockedFindUnique: any = async () => null;
let mockedFindMany: any = async () => [];
let mockedCount: any = async () => 0;

let transactionIsolationLevel: string | undefined = undefined;

(prisma as any).$transaction = async (cb: any, options: any) => {
  transactionIsolationLevel = options?.isolationLevel;
  return cb(prisma);
};
(prisma as any).facilityUnit = {
  findUnique: async (...args: any[]) => mockedFindUnique(...args),
  findMany: async (...args: any[]) => mockedFindMany(...args),
  create: async () => ({ id: "mocked" }),
  update: async () => ({ id: "mocked" }),
  updateMany: async () => ({ count: 1 })
};
(prisma as any).dicomNode = {
  count: async (...args: any[]) => mockedCount(...args),
  updateMany: async () => ({ count: 1 })
};
(prisma as any).auditLog = {
  create: async () => ({ id: "mocked" })
};

function resetMocks() {
  mockedFindUnique = async () => null;
  mockedFindMany = async () => [];
  mockedCount = async () => 0;
  transactionIsolationLevel = undefined;
}

run("createFacilityUnit uses Serializable transaction and fails on duplicate", async () => {
  resetMocks();
  mockedFindUnique = async () => ({ id: "exists", code: "TEST1", isActive: true });
  
  const service = new OrganizationService();
  let threw = false;
  try {
    await service.createFacilityUnit({
      code: "TEST1", name: "Test", type: "HOSPITAL", parentId: null, actorUserId: "u1"
    });
  } catch(e) {
    threw = true;
  }
  assert(threw, "Must throw on duplicate");
  assert(transactionIsolationLevel === "Serializable", "Isolation level must be Serializable");
});

run("deactivateFacilityUnit BLOCK strategy throws if machines active", async () => {
  resetMocks();
  mockedFindUnique = async () => ({ id: "u1", isActive: true });
  mockedCount = async () => 5; // active machines
  
  const service = new OrganizationService();
  let threw = false;
  try {
    await service.deactivateFacilityUnit({
      unitId: "u1", actorUserId: "u1", strategy: "BLOCK"
    });
  } catch(e: any) {
    threw = e.message.includes("active DICOM machines");
  }
  assert(threw, "Must block");
});

run("deactivateFacilityUnit CASCADE strategy returns updated counts and object", async () => {
  resetMocks();
  mockedFindUnique = async () => ({ id: "u1", isActive: true });
  mockedCount = async () => 5;
  
  const service = new OrganizationService();
  const res = await service.deactivateFacilityUnit({
    unitId: "u1", actorUserId: "u1", strategy: "CASCADE"
  });
  
  assert(res.unit.isActive === false, "Unit must be deactivated");
  assert(res.affectedMachines === 5, "Returns affected counts");
  assert(transactionIsolationLevel === "Serializable", "Isolation level must be Serializable");
});
