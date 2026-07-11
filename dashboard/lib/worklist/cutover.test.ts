import assert from "node:assert/strict";
import { resolveWorklistMode } from "./cutover";

assert.equal(resolveWorklistMode("LEGACY"), "LEGACY");
assert.equal(resolveWorklistMode(" shadow "), "SHADOW");
assert.equal(resolveWorklistMode("scoped"), "SCOPED");
assert.equal(resolveWorklistMode(undefined), "LEGACY");
assert.equal(resolveWorklistMode("INVALID"), "LEGACY");
assert.equal(resolveWorklistMode(undefined, "true"), "SCOPED");
assert.equal(resolveWorklistMode("INVALID", "false"), "LEGACY");

console.log("worklist cutover tests passed");
