import assert from "assert";
import { decodeWorklistCursor, encodeWorklistCursor } from "./cursor";
import { WORKLIST_CONTRACT_VERSION } from "./contract";

async function runTests() {
  console.log("--- Query Service Tests ---");

  process.env.WORKLIST_CURSOR_SECRET = "unit-test-secret";
  const sort = { key: "createdAt", direction: "desc" } as const;
  const cursor = encodeWorklistCursor({
    v: WORKLIST_CONTRACT_VERSION, id: "study-1", sortKey: sort.key, sortDirection: sort.direction,
  });
  assert.strictEqual(decodeWorklistCursor(cursor, sort).id, "study-1");
  assert.throws(() => decodeWorklistCursor(`${cursor.slice(0, -1)}x`, sort), /INVALID_CURSOR/);
  assert.throws(
    () => decodeWorklistCursor(cursor, { key: "patientName", direction: "asc" }),
    /INVALID_CURSOR/
  );
  console.log("✅ PASS: signed cursor round-trip, tamper rejection, and sort binding");
}

runTests().catch((error) => { console.error(error); process.exitCode = 1; });
