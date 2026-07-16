import assert from "node:assert/strict";
import {
  CreateRoomSchema,
  EventEnvelopeSchema,
  MessageCreateSchema,
  PHASE0_LIMITS,
} from "../phase0-contracts";

const validCreate = {
  title: "Synthetic consultation",
  priority: "ROUTINE",
  studyInstanceUid: "1.2.826.0.1.3680043.10.1000.1",
  accessMode: "INVITE_ONLY",
  waitingRoomEnabled: false,
  inviteeUserIds: [],
  startNow: false,
  idempotencyKey: "synthetic-idempotency-key-0001",
};

assert.equal(CreateRoomSchema.safeParse(validCreate).success, true);
assert.equal(CreateRoomSchema.safeParse({ ...validCreate, unexpected: true }).success, false);
assert.equal(MessageCreateSchema.safeParse({
  roomId: "00000000-0000-4000-8000-000000000001",
  clientEventId: "synthetic-client-event-0001",
  body: "x".repeat(PHASE0_LIMITS.messageCharacters + 1),
}).success, false);
assert.equal(EventEnvelopeSchema.safeParse({}).success, false);
console.log("phase0 contract tests: PASS (4 assertions)");
