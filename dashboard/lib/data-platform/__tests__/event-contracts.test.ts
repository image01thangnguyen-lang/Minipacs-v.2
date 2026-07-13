import assert from "node:assert/strict";
import { validateEventEnvelope } from "../event-contracts";
const base = { eventId: "7d42d8ef-13ce-4bad-84dc-6e9be44a237a", eventType: "STUDY_CREATED", eventVersion: 1, occurredAt: "2026-07-13T10:00:00.000Z", recordedAt: "2026-07-13T10:00:01.000Z", idempotencyKey: "study-1-created", entityType: "ImagingStudy", entityId: "study-1", phiClass: "NONE", payload: {} };
assert.equal(validateEventEnvelope(base).eventVersion, 1);
assert.throws(() => validateEventEnvelope({ ...base, payload: { patientName: "unsafe" } }), /PHI-heavy/);
assert.throws(() => validateEventEnvelope({ ...base, recordedAt: "2026-07-13T09:00:00.000Z" }), /must not precede/);
console.log("event-contract tests passed");