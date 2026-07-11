import assert from "assert";
import { resolveDatePreset, WorklistUrlStateSchema, parseWorklistUrlState, mapUrlStateToQuery, DEFAULT_URL_STATE } from "./url-state";

async function runTests() {
  console.log("--- URL State Tests ---");

  // Test 1: Date Preset TODAY for Asia/Ho_Chi_Minh
  try {
    const { from, to } = resolveDatePreset("TODAY", "Asia/Ho_Chi_Minh", new Date("2026-07-11T02:00:00.000Z"));
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    // Check duration is exactly 24 hours
    assert.strictEqual(toDate.getTime() - fromDate.getTime(), 24 * 60 * 60 * 1000, "TODAY must be exactly 24 hours");
    
    // In UTC, midnight in VN (GMT+7) is 17:00 of the previous day
    assert.strictEqual(from.endsWith("T17:00:00.000Z"), true, "from should be 17:00 UTC");
    assert.strictEqual(to.endsWith("T17:00:00.000Z"), true, "to should be 17:00 UTC");
    console.log("✅ PASS: resolves TODAY preset correctly for Asia/Ho_Chi_Minh");
  } catch (e: any) {
    console.error("❌ FAIL: resolves TODAY preset correctly for Asia/Ho_Chi_Minh", e.message);
    process.exit(1);
  }

  // Test 2: Date Preset YESTERDAY for Asia/Ho_Chi_Minh
  try {
    const { from, to } = resolveDatePreset("YESTERDAY", "Asia/Ho_Chi_Minh");
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    assert.strictEqual(toDate.getTime() - fromDate.getTime(), 24 * 60 * 60 * 1000);
    assert.strictEqual(from.endsWith("T17:00:00.000Z"), true);
    console.log("✅ PASS: resolves YESTERDAY preset correctly");
  } catch (e: any) {
    console.error("❌ FAIL: resolves YESTERDAY preset correctly", e.message);
    process.exit(1);
  }

  // Test 3: Date Preset 3DAYS for Asia/Ho_Chi_Minh
  try {
    const { from, to } = resolveDatePreset("3DAYS", "Asia/Ho_Chi_Minh");
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    assert.strictEqual(toDate.getTime() - fromDate.getTime(), 3 * 24 * 60 * 60 * 1000);
    console.log("✅ PASS: resolves 3DAYS preset correctly");
  } catch (e: any) {
    console.error("❌ FAIL: resolves 3DAYS preset correctly", e.message);
    process.exit(1);
  }

  // Test 4: Zod URL Schema
  try {
    const raw = {
      q: "nguyen van a",
      datePreset: "INVALID_PRESET",
    };
    
    // safeParse with invalid preset should fall back to default or fail. 
    // Wait, the schema does not fallback on fail, it just fails. Let's see:
    const parsed = WorklistUrlStateSchema.safeParse(raw);
    assert.strictEqual(parsed.success, false); // invalid datePreset
    console.log("✅ PASS: invalid enum fails safely");
  } catch (e: any) {
    console.error("❌ FAIL: invalid enum fails safely", e.message);
    process.exit(1);
  }

  // Invalid fields fall back independently; valid fields and unknown fields are preserved/ignored.
  const parsedUrl = parseWorklistUrlState(new URLSearchParams("q=%20Alice%20&datePreset=BAD&modality=CT&unknown=x"));
  assert.strictEqual(parsedUrl.q, "Alice");
  assert.strictEqual(parsedUrl.datePreset, "TODAY");
  assert.strictEqual(parsedUrl.modality, "CT");

  // DST boundaries use the offset at each boundary (US spring-forward day is 23 hours).
  const dst = resolveDatePreset("TODAY", "America/New_York", new Date("2024-03-10T16:00:00.000Z"));
  assert.strictEqual(Date.parse(dst.to) - Date.parse(dst.from), 23 * 60 * 60 * 1000);

  assert.throws(() => resolveDatePreset("TODAY", "Not/A_Timezone"));
  assert.strictEqual(parseWorklistUrlState(new URLSearchParams(`q=${"x".repeat(201)}`)).q, "");

  const query = mapUrlStateToQuery({ ...DEFAULT_URL_STATE, q: " Alice ", modality: "CT" });
  assert.strictEqual(query.q, "Alice");
  assert.deepStrictEqual(query.modality, ["CT"]);
}

runTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
