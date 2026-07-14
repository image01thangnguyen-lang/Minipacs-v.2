import assert from "assert";
import { WORKLIST_CONTRACT_VERSION, WorklistQueryRequestSchema } from "./contract";

async function runTests() {
  console.log("--- Worklist Contract Tests ---");

  // Test 1: validates a standard request with default limit and sort
  try {
    const input = {
      from: "2026-07-01T00:00:00Z",
      to: "2026-07-11T23:59:59Z",
      timezone: "Asia/Ho_Chi_Minh",
    };
    const parsed = WorklistQueryRequestSchema.parse(input);
    assert.strictEqual(parsed.limit, 50);
    assert.strictEqual(parsed.version, WORKLIST_CONTRACT_VERSION);
    assert.strictEqual(parsed.sort.key, "createdAt");
    assert.strictEqual(parsed.sort.direction, "desc");
    console.log("✅ PASS: validates a standard request with default limit and sort");
  } catch (e: any) {
    console.error("❌ FAIL: validates a standard request with default limit and sort", e.message);
    process.exit(1);
  }

  // Test 2: rejects invalid dates
  try {
    const input = {
      from: "invalid-date",
      to: "2026-07-11T23:59:59Z",
      timezone: "Asia/Ho_Chi_Minh",
    };
    const result = WorklistQueryRequestSchema.safeParse(input);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.strictEqual(result.error.issues[0].path[0], "from");
    }
    console.log("✅ PASS: rejects invalid dates");
  } catch (e: any) {
    console.error("❌ FAIL: rejects invalid dates", e.message);
    process.exit(1);
  }

  // Test 3: enforces array length limits
  try {
    const hugeArray = Array.from({ length: 51 }, (_, i) => `id-${i}`);
    const input = {
      from: "2026-07-01T00:00:00Z",
      to: "2026-07-11T23:59:59Z",
      timezone: "Asia/Ho_Chi_Minh",
      statuses: hugeArray,
    };
    const result = WorklistQueryRequestSchema.safeParse(input);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert(result.error.issues[0].message.includes("Array must contain at most 50 element(s)"));
    }
    console.log("✅ PASS: enforces array length limits");
  } catch (e: any) {
    console.error("❌ FAIL: enforces array length limits", e.message);
    process.exit(1);
  }

  // Test 4: enforces maximum limit limit
  try {
    const input = {
      from: "2026-07-01T00:00:00Z",
      to: "2026-07-11T23:59:59Z",
      timezone: "Asia/Ho_Chi_Minh",
      limit: 150,
    };
    const result = WorklistQueryRequestSchema.safeParse(input);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert(result.error.issues[0].message.includes("Number must be less than or equal to 100"));
    }
    console.log("✅ PASS: enforces maximum limit for pagination");
  } catch (e: any) {
    console.error("❌ FAIL: enforces maximum limit for pagination", e.message);
    process.exit(1);
  }

  const baseInput = {
    from: "2026-07-01T00:00:00Z",
    to: "2026-07-11T23:59:59Z",
    timezone: "Asia/Ho_Chi_Minh",
  };

  const rejectionCases: Array<[string, unknown]> = [
    ["unknown fields", { ...baseInput, prismaOrderBy: "secret" }],
    ["invalid timezone", { ...baseInput, timezone: "Saigon-ish" }],
    ["reversed date range", { ...baseInput, from: baseInput.to, to: baseInput.from }],
    ["oversized date range", { ...baseInput, from: "2020-01-01T00:00:00Z" }],
    ["unsupported sort key", { ...baseInput, sort: { key: "updatedAt", direction: "desc" } }],
    ["empty cursor", { ...baseInput, cursor: "" }],
    ["duplicate filter values", { ...baseInput, statuses: ["READY", "READY"] }],
    ["unsupported contract version", { ...baseInput, version: 1 }],
  ];

  for (const [name, input] of rejectionCases) {
    assert.strictEqual(
      WorklistQueryRequestSchema.safeParse(input).success,
      false,
      `${name} must be rejected`,
    );
    console.log(`✅ PASS: rejects ${name}`);
  }
}

runTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
