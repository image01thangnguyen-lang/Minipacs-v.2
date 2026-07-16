/**
 * TARGETED EXPECTED-FAIL SCAFFOLD — not part of npm test.
 * Phase 1 must replace each fail() with a domain/repository assertion and add
 * this file to the governed test command. A red run is evidence of missing
 * mitigation, never evidence that the vulnerability is fixed.
 */
import assert from "node:assert/strict";

type ScaffoldCase = { id: string; requirement: string; risk: string };
const cases: ScaffoldCase[] = [
  { id: "P0-T01", requirement: "Cross-scope detail is filtered at DB predicate", risk: "R-01" },
  { id: "P0-T02", requirement: "Unauthorized status/message/invite action is denied", risk: "R-02" },
  { id: "P0-T03", requirement: "Invalid lifecycle transition is rejected", risk: "R-03" },
  { id: "P0-T04", requirement: "Duplicate room participant is constrained atomically", risk: "R-04" },
  { id: "P0-T05", requirement: "Oversized UTF-8 message is rejected server-side", risk: "R-05" },
  { id: "P0-T06", requirement: "Stale room/artifact/minutes revision returns conflict", risk: "R-06" },
  { id: "P0-T07", requirement: "Forged artifact/minutes ID cannot cross room/scope", risk: "R-07" },
  { id: "P0-T08", requirement: "One-time join ticket replay is rejected", risk: "R-08" },
];

for (const testCase of cases) {
  console.error(`EXPECTED_FAIL ${testCase.id} ${testCase.risk}: ${testCase.requirement}`);
}
assert.fail(`${cases.length} Phase 1 security mitigations are intentionally not implemented`);
