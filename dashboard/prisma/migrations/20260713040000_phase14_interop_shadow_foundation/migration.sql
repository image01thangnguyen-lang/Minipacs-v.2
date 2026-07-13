-- Additive shadow foundation; no interface route is activated by this migration.
CREATE TABLE "integration_endpoints" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "facilityId" TEXT NOT NULL, "protocol" TEXT NOT NULL,
  "url" TEXT NOT NULL, "secretReference" TEXT, "version" TEXT NOT NULL DEFAULT '1.0', "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "integration_endpoints_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "integration_endpoints_facilityId_protocol_idx" ON "integration_endpoints"("facilityId", "protocol");
CREATE TABLE "integration_mappings" (
  "id" TEXT NOT NULL, "endpointId" TEXT NOT NULL, "messageType" TEXT NOT NULL, "schemaVersion" TEXT NOT NULL DEFAULT '1.0',
  "mappingConfig" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "integration_mappings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "integration_mappings_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "integration_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "integration_mappings_endpointId_messageType_schemaVersion_key" ON "integration_mappings"("endpointId", "messageType", "schemaVersion");
CREATE INDEX "integration_mappings_endpointId_messageType_idx" ON "integration_mappings"("endpointId", "messageType");
CREATE TABLE "inbox_messages" (
  "id" TEXT NOT NULL, "sourceEndpointId" TEXT NOT NULL, "payloadJson" TEXT NOT NULL, "idempotencyKey" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL, "orderingKey" TEXT, "status" TEXT NOT NULL DEFAULT 'PENDING', "retryCount" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "claimToken" TEXT, "lockedUntil" TIMESTAMP(3), "lastErrorCode" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "processedAt" TIMESTAMP(3),
  CONSTRAINT "inbox_messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "inbox_messages_sourceEndpointId_fkey" FOREIGN KEY ("sourceEndpointId") REFERENCES "integration_endpoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "inbox_messages_idempotencyKey_key" ON "inbox_messages"("idempotencyKey");
CREATE INDEX "inbox_messages_status_availableAt_receivedAt_idx" ON "inbox_messages"("status", "availableAt", "receivedAt");
CREATE INDEX "inbox_messages_claimToken_idx" ON "inbox_messages"("claimToken");
CREATE INDEX "inbox_messages_sourceEndpointId_orderingKey_receivedAt_idx" ON "inbox_messages"("sourceEndpointId", "orderingKey", "receivedAt");