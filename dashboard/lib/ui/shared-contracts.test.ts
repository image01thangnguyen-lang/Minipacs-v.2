import assert from "node:assert/strict";
import {
  SHARED_UI_CONTRACT_VERSION,
  STATUS_BADGE_DOMAINS,
} from "../../app/components/ui/shared-contracts";
import { resolveStatusBadge } from "./status-badge-registry";

assert.equal(SHARED_UI_CONTRACT_VERSION, 1);
assert.equal(new Set(STATUS_BADGE_DOMAINS).size, STATUS_BADGE_DOMAINS.length);
assert.deepEqual(STATUS_BADGE_DOMAINS, [
  "study",
  "report",
  "consultation",
  "his",
  "admin",
  "archive",
  "destructive",
  "storage",
  "catalog",
]);
assert.equal(resolveStatusBadge("study", " finalized ").label, "Đã ký");
assert.equal(resolveStatusBadge("study", "ARCHIVED").label, "Lưu trữ");
assert.equal(resolveStatusBadge("report", "FINALIZED").label, "FINALIZED");
assert.equal(resolveStatusBadge("consultation", "custom_state").label, "CUSTOM_STATE");
assert.equal(resolveStatusBadge("catalog", "active").label, "Kích hoạt");
assert.equal(resolveStatusBadge("storage", "").label, "Không xác định");

console.log("shared UI contract tests passed");