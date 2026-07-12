import assert from "assert";
import fs from "fs";
import path from "path";
import { scrubDiagnosticOutput } from "../scrubber";
import { WorklistQueryRequestSchema } from "../worklist/contract";

const root = path.resolve(__dirname, "../..");
const scopedReadBoundaries = [
  "app/actions/worklist-actions.ts",
  "app/actions/related-studies-actions.ts",
  "app/actions/study-workspace-actions.ts",
  "app/actions/report-workspace-actions.ts",
  "app/archive/actions.ts",
  "app/worklist/actions.ts",
  "app/statistics/actions.ts",
] as const;
for (const relative of scopedReadBoundaries) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  assert.match(source, /requirePermission|auth\(/, `${relative} must authenticate/authorize server-side`);
  assert.match(source, /buildScopeFilter|queryWorklist|queryRelatedStudies|getAllowedActionsForStudies/, `${relative} must delegate to a scoped read policy`);
}

const mutationBoundaries = [
  "app/actions/autosave-actions.ts",
  "app/actions/second-read-actions.ts",
] as const;
for (const relative of mutationBoundaries) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  assert.match(source, /requireScopedStudyMutation/, `${relative} must reload and reauthorize the resource`);
}
const autosave = fs.readFileSync(path.join(root, "app/actions/autosave-actions.ts"), "utf8");
assert.match(autosave, /updateMany[\s\S]*revision:\s*baseRevision[\s\S]*status:\s*"DRAFT"/, "autosave must atomically reject stale/finalized writes");
assert.match(autosave, /P2002[\s\S]*STALE_REVISION/, "concurrent first autosave must be idempotent/fail stale");

const validQuery = {
  from: "2026-07-11T00:00:00.000Z", to: "2026-07-12T00:00:00.000Z", timezone: "Asia/Ho_Chi_Minh",
};
assert.equal(WorklistQueryRequestSchema.safeParse({ ...validQuery, forgedRole: "ADMIN" }).success, false, "unknown/tampered fields must fail");
assert.equal(WorklistQueryRequestSchema.safeParse({ ...validQuery, limit: 101 }).success, false, "oversized page must fail");
assert.equal(WorklistQueryRequestSchema.safeParse({ ...validQuery, facilityUnitIds: Array.from({ length: 51 }, (_, i) => `F${i}`) }).success, false, "oversized scope filters must fail");

const logger = fs.readFileSync(path.join(root, "lib/telemetry/logger.ts"), "utf8");
assert.match(logger, /scrub/, "structured logger must scrub before stdout");
const scrubbed = JSON.stringify(scrubDiagnosticOutput({ patientName: "Synthetic Name", patientId: "P-1", accessionNumber: "ACC-1", findings: "sensitive report", authorization: "Bearer abc.def.ghi" }));
assert.doesNotMatch(scrubbed, /Synthetic Name|P-1|abc\.def\.ghi/, "known PHI/token values must be scrubbed");

const grid = fs.readFileSync(path.join(root, "app/components/ui/data-grid/DataGrid.tsx"), "utf8");
assert.match(grid, /<table aria-label=\{ariaLabel\}/, "native table needs an accessible name");
assert.match(grid, /ArrowDown[\s\S]*ArrowUp[\s\S]*onSelectionChange/, "rows need bounded keyboard selection");
assert.match(grid, /Enter[\s\S]*event\.preventDefault/, "rows need keyboard activation");
assert.match(grid, /focus-visible:ring-2/, "keyboard focus must remain visible");
assert.match(grid, /aria-sort/, "sortable headers must expose sort state");
assert.match(grid, /role="alert"/, "grid errors must be announced");

function luminance(hex: string): number {
  const channels = hex.slice(1).match(/.{2}/g)!.map((part) => parseInt(part, 16) / 255).map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
function contrast(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
const token = (name: string) => new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)?.[1] || "";
assert.ok(contrast(token("vin-text-primary"), token("vin-bg-root")) >= 4.5, "primary text contrast must meet WCAG AA");
assert.ok(contrast(token("vin-text-secondary"), token("vin-bg-panel")) >= 4.5, "secondary text contrast must meet WCAG AA");
console.log("security and accessibility release regression tests passed");