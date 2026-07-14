import assert from "node:assert/strict";
import {
  WorkspacePreferencesSchema,
  WorkspacePreferencesUpdateSchema,
  defaultWorkspacePreferences,
} from "./workspace-preferences";

console.log("--- Workspace Preferences Tests ---");

assert.equal(defaultWorkspacePreferences.version, 3);
assert.equal(defaultWorkspacePreferences.columns.visible.length, 10);
assert.equal(WorkspacePreferencesSchema.parse({ version: 1 }).version, 3);
assert.equal(WorkspacePreferencesSchema.parse({ version: 2 }).version, 3);
console.log("✅ PASS: stable versioned defaults");

assert.equal(WorkspacePreferencesSchema.safeParse({ density: "tiny" }).success, false);
assert.equal(WorkspacePreferencesSchema.safeParse({ unexpected: true }).success, false);
assert.equal(WorkspacePreferencesSchema.safeParse({ columns: { visible: ["patient", "forged"] } }).success, false);
assert.equal(WorkspacePreferencesSchema.safeParse({ columns: { visible: ["patient", "patient"] } }).success, false);
console.log("✅ PASS: rejects forged, unknown and duplicate values");

assert.equal(WorkspacePreferencesSchema.safeParse({ columns: { widths: { patient: 63 } } }).success, false);
assert.equal(WorkspacePreferencesSchema.safeParse({ columns: { widths: { patient: 641 } } }).success, false);
assert.equal(WorkspacePreferencesSchema.safeParse({ columns: { widths: { patient: 200 } } }).success, true);
console.log("✅ PASS: clamps width contract with bounded validation");

assert.equal(WorkspacePreferencesSchema.safeParse({ layout: { leftWidth: 10 } }).success, false);
assert.equal(WorkspacePreferencesSchema.safeParse({ layout: { leftWidth: 999 } }).success, false);
assert.equal(WorkspacePreferencesSchema.safeParse({ layout: { leftWidth: 350 } }).success, true);
console.log("✅ PASS: clamps layout contract with bounded validation");

assert.equal(WorkspacePreferencesUpdateSchema.safeParse({ density: "compact" }).success, true);
assert.equal(WorkspacePreferencesUpdateSchema.safeParse({ columns: { visible: ["patient"] } }).success, true);
assert.equal(WorkspacePreferencesUpdateSchema.safeParse({ admin: true }).success, false);
console.log("✅ PASS: validates strict partial updates");