import assert from "node:assert";
import { logger } from "./logger";
import { logShadowRunTelemetry } from "../telemetry";

async function runTests() {
  console.log("--- Telemetry Logger Tests ---");

  let logOutput: any = null;
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (msg: string) => { logOutput = JSON.parse(msg); };
  console.error = (msg: string) => { logOutput = JSON.parse(msg); };

  try {
    // Test 1: Scrub PHI
    logger.info("USER_SEARCH", {
      userId: "u123",
      patientName: "Nguyen Van A",
      patientId: "PID12345",
      searchQuery: "xray",
      hisPayload: "<xml>patient info</xml>"
    });

    assert.ok(logOutput !== null);
    assert.strictEqual(logOutput.eventName, "USER_SEARCH");
    assert.strictEqual(logOutput.userId, "u123");
    assert.strictEqual(logOutput.searchQuery, "xray");
    assert.strictEqual(logOutput.patientName, "***SCRUBBED_PHI***");
    assert.strictEqual(logOutput.patientId, "***SCRUBBED_PHI***");
    assert.strictEqual(logOutput.hisPayload, "***SCRUBBED_HIS_PAYLOAD***");
    console.log = originalLog;
    console.log("  ✅ PASS: scrubs PHI from payloads before logging");

    // Test 2: Scrub Tokens
    logOutput = null;
    logger.error("API_FAILURE", {
      endpoint: "/api/external",
      errorMessage: "Failed with token Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz"
    });

    assert.ok(logOutput !== null);
    assert.ok(logOutput.errorMessage.includes("***SCRUBBED_TOKEN***"));
    assert.ok(!logOutput.errorMessage.includes("eyJhbGci"));
    console.log = originalLog;
    console.log("  ✅ PASS: scrubs Bearer tokens from string values");

    // Test 3: circular diagnostic input cannot crash logging.
    console.log = (msg: string) => { logOutput = JSON.parse(msg); };
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    logger.info("CYCLIC_INPUT", cyclic);
    assert.strictEqual(logOutput.self.self, "***SCRUBBED_CIRCULAR***");

    // Test 4: invalid telemetry is rejected instead of reporting false success.
    assert.throws(() => logShadowRunTelemetry({
      legacyLatencyMs: -1,
      scopedLatencyMs: 1,
      legacyRowsCount: 1,
      scopedRowsCount: 1,
      legacySucceeded: true,
      scopedSucceeded: true,
    }));

  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
