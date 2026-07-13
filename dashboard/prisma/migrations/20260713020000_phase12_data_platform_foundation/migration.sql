-- Additive, shadow-only Phase 12 foundation.
CREATE TABLE "outbox_messages" (
  "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "eventType" TEXT NOT NULL, "eventVersion" INTEGER NOT NULL DEFAULT 1,
  "payload" JSONB NOT NULL, "idempotencyKey" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING',
  "retryCount" INTEGER NOT NULL DEFAULT 0, "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "claimToken" TEXT, "lockedUntil" TIMESTAMP(3), "lastErrorCode" TEXT, "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "processedAt" TIMESTAMP(3), CONSTRAINT "outbox_messages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "outbox_messages_eventId_key" ON "outbox_messages"("eventId");
CREATE UNIQUE INDEX "outbox_messages_idempotencyKey_key" ON "outbox_messages"("idempotencyKey");
CREATE INDEX "outbox_messages_status_availableAt_occurredAt_idx" ON "outbox_messages"("status", "availableAt", "occurredAt");
CREATE INDEX "outbox_messages_claimToken_idx" ON "outbox_messages"("claimToken");
CREATE TABLE "domain_events" (
  "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "eventType" TEXT NOT NULL, "eventVersion" INTEGER NOT NULL DEFAULT 1,
  "idempotencyKey" TEXT NOT NULL, "payload" JSONB NOT NULL, "correlationId" TEXT, "causationId" TEXT,
  "actorType" TEXT, "actorId" TEXT, "organizationId" TEXT, "facilityId" TEXT, "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL, "reportRevision" INTEGER, "phiClass" TEXT NOT NULL DEFAULT 'NONE',
  "occurredAt" TIMESTAMP(3) NOT NULL, "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "domain_events_eventId_key" ON "domain_events"("eventId");
CREATE UNIQUE INDEX "domain_events_idempotencyKey_key" ON "domain_events"("idempotencyKey");
CREATE INDEX "domain_events_eventType_occurredAt_idx" ON "domain_events"("eventType", "occurredAt");
CREATE INDEX "domain_events_facilityId_eventType_idx" ON "domain_events"("facilityId", "eventType");
CREATE INDEX "domain_events_entityType_entityId_idx" ON "domain_events"("entityType", "entityId");
CREATE TABLE "worker_leases" ("id" TEXT NOT NULL, "ownerId" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "version" INTEGER NOT NULL DEFAULT 0, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "worker_leases_pkey" PRIMARY KEY ("id"));