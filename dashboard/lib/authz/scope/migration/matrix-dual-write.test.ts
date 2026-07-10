import { dualWriteMachinePermission } from "./matrix-dual-write";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function run(name: string, test: () => Promise<void>) {
  try {
    await test();
    console.log(`✅ PASS: ${name}`);
  } catch (error) {
    console.error(`❌ FAIL: ${name}`, error);
    process.exitCode = 1;
  }
}

console.log("--- matrix-dual-write ---");

(async () => {
  for (const state of ["ALLOW", "DENY"] as const) {
    await run(`${state} synchronizes both representations`, async () => {
      const calls: Array<{ operation: string; args: any }> = [];
      const tx = {
        doctorMachinePermission: {
          upsert: async (args: any) => calls.push({ operation: "legacy.upsert", args }),
        },
        accessScopeGrant: {
          updateMany: async (args: any) => {
            calls.push({ operation: "grant.updateMany", args });
            return { count: 0 };
          },
          create: async (args: any) => calls.push({ operation: "grant.create", args }),
        },
      } as any;

      await dualWriteMachinePermission(tx, "doctor", "admin", {
        dicomNodeId: "node",
        actionKey: "READ_STUDY",
        state,
      });
      assert(calls[0].args.create.allow === (state === "ALLOW"), "Legacy effect should match");
      assert(calls[2].args.data.effect === state, "Scope effect should match");
      assert(calls[2].args.data.includeDescendants === false, "Grant must be node-specific");
    });
  }

  await run("DEFAULT deletes both representations", async () => {
    const calls: string[] = [];
    const tx = {
      doctorMachinePermission: {
        deleteMany: async () => {
          calls.push("legacy");
          return { count: 1 };
        },
      },
      accessScopeGrant: {
        deleteMany: async () => {
          calls.push("grant");
          return { count: 1 };
        },
      },
    } as any;
    const result = await dualWriteMachinePermission(tx, "doctor", "admin", {
      dicomNodeId: "node",
      actionKey: "READ_STUDY",
      state: "DEFAULT",
    });
    assert(calls.join(",") === "legacy,grant", "Both representations should be deleted");
    assert(result.deleted === 1, "Deletion count should reflect legacy rows");
  });
})();