/**
 * Phase 0 design contracts only. They are not wired to production routes.
 * Any Phase 1+ change must preserve or explicitly supersede these schemas.
 */
import { z } from "zod";

const strictObject = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict();
const id = z.string().uuid();
const opaqueId = z.string().min(16).max(128).regex(/^[A-Za-z0-9_-]+$/);
const dicomUid = z.string().min(3).max(64).regex(/^\d+(\.\d+)+$/);
const isoDate = z.string().datetime({ offset: true });
const boundedText = (max: number) => z.string().trim().min(1).max(max);

export const PHASE0_LIMITS = Object.freeze({
  titleCharacters: 160,
  reasonCharacters: 4_000,
  messageUtf8Bytes: 8_192,
  messageCharacters: 4_096,
  inviteBatch: 50,
  cursorCharacters: 256,
  artifactPayloadBytes: 32_768,
  minutesFieldCharacters: 20_000,
  eventPayloadBytes: 65_536,
  maxJsonDepth: 8,
  passwordAttemptsPer15Minutes: 10,
  messageRatePerMinute: 30,
  viewportRatePerSecond: 15,
  joinTicketTtlSeconds: 60,
  accessGrantTtlSeconds: 900,
  resumeWindowSeconds: 300,
});

export const ConsultationLifecycleSchema = z.enum([
  "DRAFT", "READY", "SCHEDULED", "LIVE", "ENDED", "CANCELLED",
]);
export const AccessModeSchema = z.enum(["INVITE_ONLY", "PASSWORD", "INVITE_OR_PASSWORD"]);
export const ParticipantRoleSchema = z.enum(["HOST", "PRESENTER", "CONSULTANT", "OBSERVER"]);
export const ParticipantStatusSchema = z.enum([
  "INVITED", "WAITING", "JOINED", "DISCONNECTED", "LEFT", "REMOVED", "DECLINED",
]);
export const ErrorCodeSchema = z.enum([
  "UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND", "INVALID_INPUT", "INVALID_TRANSITION",
  "STALE_REVISION", "RATE_LIMITED", "ROOM_LOCKED", "RESYNC_REQUIRED", "DEPENDENCY_UNAVAILABLE",
]);

export const ApiErrorSchema = strictObject({
  code: ErrorCodeSchema,
  message: z.string().min(1).max(200),
  correlationId: opaqueId.optional(),
  retryAfterSeconds: z.number().int().min(1).max(3600).optional(),
});

export const CreateRoomSchema = strictObject({
  title: boundedText(PHASE0_LIMITS.titleCharacters),
  reason: z.string().trim().max(PHASE0_LIMITS.reasonCharacters).optional(),
  priority: z.enum(["ROUTINE", "URGENT", "STAT"]),
  studyInstanceUid: dicomUid,
  accessMode: AccessModeSchema,
  password: z.string().min(12).max(128).optional(),
  waitingRoomEnabled: z.boolean(),
  inviteeUserIds: z.array(id).max(PHASE0_LIMITS.inviteBatch),
  startNow: z.boolean(),
  idempotencyKey: opaqueId,
});

export const BootstrapRequestSchema = strictObject({ roomId: id });
export const BootstrapResponseSchema = strictObject({
  roomId: id,
  roomEpoch: z.number().int().positive(),
  revision: z.number().int().nonnegative(),
  lifecycle: ConsultationLifecycleSchema,
  accessMode: AccessModeSchema,
  locked: z.boolean(),
  participantId: id,
  role: ParticipantRoleSchema,
  allowedActions: z.array(z.string().min(1).max(64)).max(64),
  study: strictObject({ studyRef: opaqueId }),
});

export const InviteSchema = strictObject({
  roomId: id,
  revision: z.number().int().nonnegative(),
  invitees: z.array(strictObject({ userId: id, role: ParticipantRoleSchema })).min(1).max(PHASE0_LIMITS.inviteBatch),
  idempotencyKey: opaqueId,
});

export const AccessVerifySchema = strictObject({
  roomId: id,
  password: z.string().min(1).max(128),
});
export const JoinTicketRequestSchema = strictObject({ roomId: id, roomEpoch: z.number().int().positive() });
export const JoinTicketResponseSchema = strictObject({ ticket: opaqueId, expiresAt: isoDate });

export const TransitionSchema = strictObject({
  roomId: id,
  from: ConsultationLifecycleSchema,
  to: ConsultationLifecycleSchema,
  revision: z.number().int().nonnegative(),
  reason: z.string().trim().max(1_000).optional(),
  idempotencyKey: opaqueId,
});

export const MessageCreateSchema = strictObject({
  roomId: id,
  clientEventId: opaqueId,
  body: boundedText(PHASE0_LIMITS.messageCharacters).refine(
    value => Buffer.byteLength(value, "utf8") <= PHASE0_LIMITS.messageUtf8Bytes,
    "message exceeds UTF-8 byte limit",
  ),
});

const ArtifactSourceSchema = strictObject({
  seriesInstanceUid: dicomUid,
  sopInstanceUid: dicomUid,
  frameNumber: z.number().int().positive().optional(),
});
export const ArtifactMutationSchema = strictObject({
  roomId: id,
  artifactId: id.optional(),
  revision: z.number().int().nonnegative(),
  operation: z.enum(["CREATE", "UPDATE", "DELETE", "ACCEPT", "REJECT"]),
  source: ArtifactSourceSchema,
  toolType: z.string().min(1).max(64),
  normalizedPayload: z.record(z.unknown()),
  clientEventId: opaqueId,
});

export const MinutesUpdateSchema = strictObject({
  roomId: id,
  minutesId: id,
  revision: z.number().int().nonnegative(),
  consensusDiagnosis: z.string().max(PHASE0_LIMITS.minutesFieldCharacters),
  treatmentPlan: z.string().max(PHASE0_LIMITS.minutesFieldCharacters),
  acceptedArtifactIds: z.array(id).max(200),
  idempotencyKey: opaqueId,
});
export const MinutesSignSchema = strictObject({
  roomId: id,
  minutesId: id,
  revision: z.number().int().nonnegative(),
  meaning: z.enum(["AUTHOR", "REVIEWER", "CONSENTER"]),
  idempotencyKey: opaqueId,
});
export const MinutesFinalizeSchema = strictObject({
  roomId: id,
  minutesId: id,
  revision: z.number().int().nonnegative(),
  contentHash: z.string().length(64).regex(/^[a-f0-9]+$/),
  idempotencyKey: opaqueId,
});
export const IntegrationRetrySchema = strictObject({
  roomId: id,
  outboxId: id,
  expectedAttempt: z.number().int().nonnegative(),
  idempotencyKey: opaqueId,
});

export const EventTypeSchema = z.enum([
  "room.join", "presence.heartbeat", "chat.send", "viewport.publish", "artifact.create",
  "artifact.update", "artifact.delete", "presenter.request", "presenter.release", "room.snapshot",
  "room.ended", "room.locked", "presence.changed", "chat.committed", "presenter.changed",
  "viewport.state", "artifact.committed", "access.revoked", "error", "ack",
]);
export const EventEnvelopeSchema = strictObject({
  eventId: id,
  roomId: id,
  roomEpoch: z.number().int().positive(),
  sequence: z.number().int().nonnegative(),
  type: EventTypeSchema,
  actorParticipantId: id.nullable(),
  clientId: opaqueId,
  occurredAt: isoDate,
  schemaVersion: z.literal("1.0"),
  payload: z.record(z.unknown()),
});

export type Phase0EventEnvelope = z.infer<typeof EventEnvelopeSchema>;
export type Phase0CreateRoom = z.infer<typeof CreateRoomSchema>;
