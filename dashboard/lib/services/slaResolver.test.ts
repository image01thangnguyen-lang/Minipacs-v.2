import { SlaPolicy } from "@prisma/client";
import { resolveSlaPolicy, calculateSlaDuration, evaluateSlaThreshold, SlaStage } from "./slaResolver";

// A simple test runner since we don't have Jest
function describe(name: string, fn: () => void) {
  console.log(`\n--- ${name} ---`);
  fn();
}

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
  } catch (err: any) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err.message);
    process.exit(1);
  }
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected} but got ${actual}`);
      }
    },
    toEqual(expected: any) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    }
  };
}

describe("slaResolver - calculateSlaDuration", () => {
  const now = new Date("2026-07-06T12:00:00Z");

  test("Missing start -> NOT_MEASURABLE", () => {
    const result = calculateSlaDuration("SCAN_TO_RECEIVED", null, new Date(), "RECEIVED", now);
    expect(result.durationMinutes).toBe("NOT_MEASURABLE");
    expect(result.status).toBe("MISSING_END");
  });

  test("Ongoing (has start, no end, correct status) -> now - start", () => {
    const start = new Date("2026-07-06T11:30:00Z");
    const result = calculateSlaDuration("RECEIVED_TO_FIRST_READ", start, null, "READY_TO_READ", now);
    expect(result.durationMinutes).toBe(30);
    expect(result.status).toBe("ONGOING");
  });

  test("Passed (has start, no end, status has passed) -> NOT_MEASURABLE", () => {
    const start = new Date("2026-07-06T11:00:00Z");
    // STAGE is SCAN_TO_RECEIVED, but current status is FINALIZED (already passed)
    const result = calculateSlaDuration("SCAN_TO_RECEIVED", start, null, "FINALIZED", now);
    expect(result.durationMinutes).toBe("NOT_MEASURABLE");
    expect(result.status).toBe("MISSING_END");
  });

  test("Passed correctly (has start and end) -> end - start", () => {
    const start = new Date("2026-07-06T11:00:00Z");
    const end = new Date("2026-07-06T11:15:00Z");
    const result = calculateSlaDuration("CHECKIN_TO_SCAN", start, end, "STABLE", now);
    expect(result.durationMinutes).toBe(15);
    expect(result.status).toBe("PASSED");
  });

  test("END_TO_END stage should NOT be marked as passed at FINALIZED", () => {
    const start = new Date("2026-07-06T11:00:00Z");
    const result = calculateSlaDuration("END_TO_END", start, null, "FINALIZED", now);
    expect(result.status).toBe("ONGOING");
  });

  test("END_TO_END stage should be marked as passed at DELIVERED", () => {
    const start = new Date("2026-07-06T11:00:00Z");
    const result = calculateSlaDuration("END_TO_END", start, null, "DELIVERED", now);
    expect(result.status).toBe("MISSING_END"); // It passed, but missing end time
  });
});

describe("slaResolver - resolveSlaPolicy", () => {
  const now = new Date("2026-07-06T12:00:00Z");

  const basePolicy: SlaPolicy = {
    id: "1",
    code: "POL_GLOBAL",
    name: "Global",
    scope: "GLOBAL",
    facilityId: null,
    modality: null,
    procedureCatalogId: null,
    priority: null,
    doctorId: null,
    role: null,
    machineId: null,
    module: null,
    stage: "RECEIVED_TO_FIRST_READ",
    thresholdMinutes: 120,
    warningThresholdMinutes: null,
    severity: "MEDIUM",
    effectiveFrom: null,
    effectiveTo: null,
    description: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  test("Fallback when no policies", () => {
    const result = resolveSlaPolicy([], "RECEIVED_TO_FIRST_READ", {}, now);
    expect(result.source).toBe("FALLBACK");
    expect(result.thresholdMinutes).toBe(1440);
  });

  test("Select global policy", () => {
    const result = resolveSlaPolicy([basePolicy], "RECEIVED_TO_FIRST_READ", {}, now);
    expect(result.source).toBe("POLICY");
    expect(result.policyCode).toBe("POL_GLOBAL");
  });

  test("Select machine over global (Precedence)", () => {
    const machinePolicy = { ...basePolicy, id: "2", code: "POL_MACHINE", scope: "MACHINE", machineId: "M1", thresholdMinutes: 60 };
    const result = resolveSlaPolicy([basePolicy, machinePolicy], "RECEIVED_TO_FIRST_READ", { machineId: "M1" }, now);
    expect(result.source).toBe("POLICY");
    expect(result.policyCode).toBe("POL_MACHINE");
    expect(result.thresholdMinutes).toBe(60);
  });

  test("Tie-break: effectiveFrom DESC NULLS LAST", () => {
    const policy1 = { ...basePolicy, id: "1", code: "POL_1", effectiveFrom: null };
    const policy2 = { ...basePolicy, id: "2", code: "POL_2", effectiveFrom: new Date("2026-01-01T00:00:00Z") };
    const policy3 = { ...basePolicy, id: "3", code: "POL_3", effectiveFrom: new Date("2026-06-01T00:00:00Z") };

    // policy3 should win because it has the most recent effectiveFrom
    const result = resolveSlaPolicy([policy1, policy2, policy3], "RECEIVED_TO_FIRST_READ", {}, now);
    expect(result.policyCode).toBe("POL_3");
  });
});

console.log("\nAll tests passed successfully! 🎉\n");
