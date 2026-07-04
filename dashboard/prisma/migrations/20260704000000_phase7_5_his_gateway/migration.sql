-- CreateTable
CREATE TABLE "his_connection_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "baseUrl" TEXT,
    "authMode" TEXT NOT NULL,
    "apiKeyEncrypted" TEXT,
    "bearerTokenEncrypted" TEXT,
    "basicUsername" TEXT,
    "basicPasswordEncrypted" TEXT,
    "hmacSecretEncrypted" TEXT,
    "timeoutMs" INTEGER NOT NULL DEFAULT 10000,
    "retryMax" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastHealthStatus" TEXT,
    "lastHealthMessage" TEXT,
    "lastHealthCheckedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "his_connection_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "his_api_call_logs" (
    "id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "endpointKey" TEXT,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL,
    "durationMs" INTEGER,
    "requestId" TEXT,
    "correlationId" TEXT,
    "remoteIp" TEXT,
    "actorType" TEXT,
    "actorUserId" TEXT,
    "accessionNumber" TEXT,
    "studyInstanceUid" TEXT,
    "reportId" TEXT,
    "hisOrderId" TEXT,
    "hisMessageId" TEXT,
    "requestSummaryJson" TEXT,
    "responseSummaryJson" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "his_api_call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "his_field_mappings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "sourceField" TEXT NOT NULL,
    "targetField" TEXT NOT NULL,
    "transformRule" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "his_field_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "his_conflicts" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "accessionNumber" TEXT,
    "studyInstanceUid" TEXT,
    "fieldName" TEXT NOT NULL,
    "currentValue" TEXT,
    "incomingValue" TEXT,
    "status" TEXT NOT NULL,
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "his_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "his_api_call_logs_createdAt_idx" ON "his_api_call_logs"("createdAt");
CREATE INDEX "his_api_call_logs_direction_idx" ON "his_api_call_logs"("direction");
CREATE INDEX "his_api_call_logs_statusCode_idx" ON "his_api_call_logs"("statusCode");
CREATE INDEX "his_api_call_logs_success_idx" ON "his_api_call_logs"("success");
CREATE INDEX "his_api_call_logs_endpointKey_idx" ON "his_api_call_logs"("endpointKey");
CREATE INDEX "his_api_call_logs_accessionNumber_idx" ON "his_api_call_logs"("accessionNumber");
CREATE INDEX "his_api_call_logs_studyInstanceUid_idx" ON "his_api_call_logs"("studyInstanceUid");
CREATE INDEX "his_api_call_logs_requestId_idx" ON "his_api_call_logs"("requestId");

-- CreateIndex
CREATE INDEX "his_conflicts_status_idx" ON "his_conflicts"("status");
CREATE INDEX "his_conflicts_entityType_entityId_idx" ON "his_conflicts"("entityType", "entityId");
CREATE INDEX "his_conflicts_accessionNumber_idx" ON "his_conflicts"("accessionNumber");
CREATE INDEX "his_conflicts_studyInstanceUid_idx" ON "his_conflicts"("studyInstanceUid");
CREATE INDEX "his_conflicts_createdAt_idx" ON "his_conflicts"("createdAt");
