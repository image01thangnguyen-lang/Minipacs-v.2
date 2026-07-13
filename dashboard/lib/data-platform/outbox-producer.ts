import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { CanonicalEventEnvelope, EventType, JsonValue, validateEventEnvelope } from "./event-contracts";

export interface OutboxEventInput {
  eventType: EventType;
  occurredAt: Date | string;
  idempotencyKey: string;
  correlationId?: string;
  causationId?: string;
  actor?: CanonicalEventEnvelope["actor"];
  organizationId?: string;
  facilityId?: string;
  entityType: string;
  entityId: string;
  reportRevision?: number;
  phiClass: CanonicalEventEnvelope["phiClass"];
  payload?: Record<string, JsonValue>;
}

/**
 * Builds data for tx.outboxMessage.create(). The caller MUST persist this in
 * the same Prisma transaction as the business mutation; this helper performs no IO.
 */
export function createOutboxMessage(event: OutboxEventInput): Prisma.OutboxMessageCreateInput {
  const occurredAt = event.occurredAt instanceof Date ? event.occurredAt.toISOString() : event.occurredAt;
  const fullEvent = validateEventEnvelope({
    ...event,
    eventId: randomUUID(),
    eventVersion: 1,
    occurredAt,
    recordedAt: new Date().toISOString(),
    payload: event.payload ?? {},
  });

  return {
    eventId: fullEvent.eventId,
    eventType: fullEvent.eventType,
    eventVersion: fullEvent.eventVersion,
    payload: fullEvent as Prisma.InputJsonValue,
    idempotencyKey: fullEvent.idempotencyKey,
    status: "PENDING",
    occurredAt: new Date(fullEvent.occurredAt),
    availableAt: new Date(),
  };
}