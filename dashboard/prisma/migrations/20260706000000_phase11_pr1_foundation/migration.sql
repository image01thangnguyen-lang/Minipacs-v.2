-- AlterTable
ALTER TABLE "critical_results" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "acknowledgedByUserId" TEXT,
ADD COLUMN     "assignedToUserId" TEXT,
ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "dueAt" TIMESTAMP(3),
ADD COLUMN     "escalatedAt" TIMESTAMP(3),
ADD COLUMN     "message" TEXT,
ADD COLUMN     "recipientContact" TEXT,
ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "reportId" TEXT,
ADD COLUMN     "status" TEXT;

-- CreateTable
CREATE TABLE "scheduler_leases" (
    "id" TEXT NOT NULL,
    "leaseKey" TEXT NOT NULL,
    "fencingToken" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduler_leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_runs" (
    "id" TEXT NOT NULL,
    "leaseKey" TEXT NOT NULL,
    "fencingToken" INTEGER NOT NULL,
    "ownerId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "logJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "severity" TEXT NOT NULL DEFAULT 'WARNING',
    "conditionJson" TEXT NOT NULL,
    "actionJson" TEXT,
    "cooldownMins" INTEGER NOT NULL DEFAULT 60,
    "metadataJson" TEXT,
    "thresholdPolicyId" TEXT,
    "creatorId" TEXT,
    "scope" TEXT,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_events" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "ruleId" TEXT,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "entityType" TEXT,
    "entityId" TEXT,
    "metadataJson" TEXT,
    "acknowledgedByUserId" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_policies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "facilityId" TEXT,
    "modality" TEXT,
    "procedureCatalogId" TEXT,
    "priority" TEXT,
    "doctorId" TEXT,
    "role" TEXT,
    "machineId" TEXT,
    "module" TEXT,
    "stage" TEXT NOT NULL,
    "thresholdMinutes" INTEGER NOT NULL,
    "warningThresholdMinutes" INTEGER,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_threshold_policies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "groupKey" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scopeType" TEXT NOT NULL DEFAULT 'GLOBAL',
    "scopeValue" TEXT,
    "operator" TEXT NOT NULL DEFAULT '>=',
    "warningValue" DOUBLE PRECISION,
    "criticalValue" DOUBLE PRECISION,
    "unit" TEXT NOT NULL,
    "evaluationWindowMinutes" INTEGER,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 30,
    "escalationMode" TEXT NOT NULL DEFAULT 'ALERT',
    "ownerRole" TEXT,
    "playbookUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "control_threshold_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scheduler_leases_leaseKey_key" ON "scheduler_leases"("leaseKey");

-- CreateIndex
CREATE INDEX "scheduler_leases_status_idx" ON "scheduler_leases"("status");

-- CreateIndex
CREATE INDEX "scheduler_leases_expiresAt_idx" ON "scheduler_leases"("expiresAt");

-- CreateIndex
CREATE INDEX "worker_runs_leaseKey_fencingToken_idx" ON "worker_runs"("leaseKey", "fencingToken");

-- CreateIndex
CREATE INDEX "worker_runs_status_idx" ON "worker_runs"("status");

-- CreateIndex
CREATE INDEX "worker_runs_createdAt_idx" ON "worker_runs"("createdAt");

-- CreateIndex
CREATE INDEX "alert_rules_isActive_idx" ON "alert_rules"("isActive");

-- CreateIndex
CREATE INDEX "alert_rules_ruleType_idx" ON "alert_rules"("ruleType");

-- CreateIndex
CREATE UNIQUE INDEX "alert_events_idempotencyKey_key" ON "alert_events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "alert_events_status_idx" ON "alert_events"("status");

-- CreateIndex
CREATE INDEX "alert_events_severity_idx" ON "alert_events"("severity");

-- CreateIndex
CREATE INDEX "alert_events_entityType_entityId_idx" ON "alert_events"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "alert_events_createdAt_idx" ON "alert_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sla_policies_code_key" ON "sla_policies"("code");

-- CreateIndex
CREATE INDEX "sla_policies_scope_idx" ON "sla_policies"("scope");

-- CreateIndex
CREATE INDEX "sla_policies_facilityId_idx" ON "sla_policies"("facilityId");

-- CreateIndex
CREATE INDEX "sla_policies_procedureCatalogId_idx" ON "sla_policies"("procedureCatalogId");

-- CreateIndex
CREATE INDEX "sla_policies_doctorId_idx" ON "sla_policies"("doctorId");

-- CreateIndex
CREATE INDEX "sla_policies_machineId_idx" ON "sla_policies"("machineId");

-- CreateIndex
CREATE INDEX "sla_policies_module_idx" ON "sla_policies"("module");

-- CreateIndex
CREATE INDEX "sla_policies_isActive_idx" ON "sla_policies"("isActive");

-- CreateIndex
CREATE INDEX "sla_policies_stage_idx" ON "sla_policies"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "control_threshold_policies_code_key" ON "control_threshold_policies"("code");

-- CreateIndex
CREATE INDEX "control_threshold_policies_groupKey_idx" ON "control_threshold_policies"("groupKey");

-- CreateIndex
CREATE INDEX "control_threshold_policies_metricKey_idx" ON "control_threshold_policies"("metricKey");

-- CreateIndex
CREATE INDEX "control_threshold_policies_scopeType_scopeValue_idx" ON "control_threshold_policies"("scopeType", "scopeValue");

-- CreateIndex
CREATE INDEX "control_threshold_policies_isActive_idx" ON "control_threshold_policies"("isActive");

-- CreateIndex
CREATE INDEX "critical_results_status_idx" ON "critical_results"("status");

-- CreateIndex
CREATE INDEX "critical_results_reportId_idx" ON "critical_results"("reportId");

-- CreateIndex
CREATE INDEX "critical_results_assignedToUserId_idx" ON "critical_results"("assignedToUserId");

-- CreateIndex
CREATE INDEX "critical_results_dueAt_idx" ON "critical_results"("dueAt");

-- AddForeignKey
ALTER TABLE "worker_runs" ADD CONSTRAINT "worker_runs_leaseKey_fkey" FOREIGN KEY ("leaseKey") REFERENCES "scheduler_leases"("leaseKey") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "critical_results" ADD CONSTRAINT "critical_results_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "critical_results" ADD CONSTRAINT "critical_results_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "critical_results" ADD CONSTRAINT "critical_results_acknowledgedByUserId_fkey" FOREIGN KEY ("acknowledgedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_thresholdPolicyId_fkey" FOREIGN KEY ("thresholdPolicyId") REFERENCES "control_threshold_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "alert_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_acknowledgedByUserId_fkey" FOREIGN KEY ("acknowledgedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_policies" ADD CONSTRAINT "sla_policies_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facility_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_policies" ADD CONSTRAINT "sla_policies_procedureCatalogId_fkey" FOREIGN KEY ("procedureCatalogId") REFERENCES "procedure_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_policies" ADD CONSTRAINT "sla_policies_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_policies" ADD CONSTRAINT "sla_policies_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "dicom_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_threshold_policies" ADD CONSTRAINT "control_threshold_policies_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Data Migration for CriticalResult
DO $$
DECLARE
  unmappable_count INT;
BEGIN
  -- Backfill mappable records
  UPDATE "critical_results"
  SET 
    "status" = CASE 
      WHEN "communicationStatus" = 'PENDING' THEN 'PENDING_ACK'
      WHEN "communicationStatus" = 'COMMUNICATED' THEN 'ACKNOWLEDGED'
      WHEN "communicationStatus" IN ('RESOLVED', 'CLOSED') AND "communicatedAt" IS NOT NULL THEN 'ACKNOWLEDGED'
      ELSE NULL
    END,
    "message" = "finding",
    "recipientName" = "communicatedTo",
    "acknowledgedAt" = CASE 
      WHEN "communicationStatus" = 'COMMUNICATED' OR ("communicationStatus" IN ('RESOLVED', 'CLOSED') AND "communicatedAt" IS NOT NULL) THEN "communicatedAt"
      ELSE NULL
    END;

  -- Persist one non-PHI audit entry per unmappable legacy record.
  INSERT INTO "audit_logs" (
    "id", "actorUserId", "action", "entityType", "entityId",
    "message", "metadataJson", "createdAt"
  )
  SELECT
    'phase11-critical-result-' || "id",
    NULL,
    'CRITICAL_RESULT_MIGRATION_UNMAPPABLE',
    'CriticalResult',
    "id",
    'Legacy CriticalResult status requires manual review.',
    json_build_object('legacyCommunicationStatus', "communicationStatus")::text,
    CURRENT_TIMESTAMP
  FROM "critical_results"
  WHERE "status" IS NULL
  ON CONFLICT ("id") DO NOTHING;

  -- Track unmappable records
  SELECT count(*) INTO unmappable_count FROM "critical_results" WHERE "status" IS NULL;
  
  IF unmappable_count > 0 THEN
    RAISE WARNING 'Migration Warning: % critical_results records were unmappable and left with status = NULL. Manual review required.', unmappable_count;
  END IF;
END $$;

