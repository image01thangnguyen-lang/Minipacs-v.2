import assert from "node:assert/strict";
import { retryDelayMs, safeErrorCode } from "../worker-runtime";
assert.equal(retryDelayMs(1), 1_000);
assert.equal(retryDelayMs(3), 4_000);
assert.equal(retryDelayMs(100), 900_000);
assert.equal(safeErrorCode(new TypeError("raw details")), "TypeError");
assert.equal(safeErrorCode("patient name"), "PROCESSING_ERROR");
console.log("worker-runtime tests passed");
