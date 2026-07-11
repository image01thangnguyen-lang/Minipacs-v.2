import assert from "node:assert/strict";
import { buildSelectionHref, normalizeStudyUid } from "./selection-state";

assert.equal(normalizeStudyUid(" 1.2.840.10008 "), "1.2.840.10008");
assert.equal(normalizeStudyUid("not-a-dicom-uid"), undefined);
assert.equal(normalizeStudyUid(`1.${"2".repeat(129)}`), undefined);

assert.equal(buildSelectionHref("/", "status=READY", "1.2.3"), "/?status=READY&study=1.2.3");
assert.equal(buildSelectionHref("/", "study=1.2.3&status=READY"), "/?status=READY");
assert.equal(buildSelectionHref("/workspace", "study=1.2.3"), "/workspace");
assert.equal(buildSelectionHref("/workspace", "study=1.2.3", "invalid"), "/workspace");

console.log("selection-state tests passed");