-- Phase 9 - Production Hardening And Native Workstation Extensions

CREATE TABLE "system_health_check_runs" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "triggeredByUserId" TEXT,
    "trigger" TEXT NOT NULL,
    "summaryJson" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    CONSTRAINT "system_health_check_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "system_health_check_items" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "checkKey" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "durationMs" INTEGER,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_health_check_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "security_audit_runs" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "triggeredByUserId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    CONSTRAINT "security_audit_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "security_audit_findings" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "findingKey" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affectedArea" TEXT NOT NULL,
    "recommendation" TEXT,
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "security_audit_findings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "performance_test_runs" (
    "id" TEXT NOT NULL,
    "testKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "triggeredByUserId" TEXT,
    "durationMs" INTEGER,
    "inputJson" TEXT,
    "resultJson" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "performance_test_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dicom_conformance_runs" (
    "id" TEXT NOT NULL,
    "testKey" TEXT NOT NULL,
    "dicomNodeId" TEXT,
    "status" TEXT NOT NULL,
    "durationMs" INTEGER,
    "requestSummaryJson" TEXT,
    "responseSummaryJson" TEXT,
    "errorMessage" TEXT,
    "triggeredByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dicom_conformance_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dicom_conformance_run_items" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "durationMs" INTEGER,
    "message" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dicom_conformance_run_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "native_connector_configs" (
    "id" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "baseUrl" TEXT,
    "sharedSecret" TEXT,
    "allowedActionsJson" TEXT,
    "lastHealthStatus" TEXT,
    "lastHealthAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "native_connector_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "native_connector_events" (
    "id" TEXT NOT NULL,
    "actionKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "actorUserId" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "message" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "native_connector_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "system_health_check_runs_status_idx" ON "system_health_check_runs"("status");
CREATE INDEX "system_health_check_runs_startedAt_idx" ON "system_health_check_runs"("startedAt");
CREATE INDEX "system_health_check_runs_triggeredByUserId_idx" ON "system_health_check_runs"("triggeredByUserId");
CREATE INDEX "system_health_check_items_runId_idx" ON "system_health_check_items"("runId");
CREATE INDEX "system_health_check_items_checkKey_idx" ON "system_health_check_items"("checkKey");
CREATE INDEX "system_health_check_items_status_idx" ON "system_health_check_items"("status");
CREATE INDEX "system_health_check_items_createdAt_idx" ON "system_health_check_items"("createdAt");
CREATE INDEX "security_audit_runs_status_idx" ON "security_audit_runs"("status");
CREATE INDEX "security_audit_runs_startedAt_idx" ON "security_audit_runs"("startedAt");
CREATE INDEX "security_audit_runs_triggeredByUserId_idx" ON "security_audit_runs"("triggeredByUserId");
CREATE INDEX "security_audit_findings_runId_idx" ON "security_audit_findings"("runId");
CREATE INDEX "security_audit_findings_findingKey_idx" ON "security_audit_findings"("findingKey");
CREATE INDEX "security_audit_findings_severity_idx" ON "security_audit_findings"("severity");
CREATE INDEX "security_audit_findings_status_idx" ON "security_audit_findings"("status");
CREATE INDEX "security_audit_findings_resolvedByUserId_idx" ON "security_audit_findings"("resolvedByUserId");
CREATE INDEX "performance_test_runs_testKey_idx" ON "performance_test_runs"("testKey");
CREATE INDEX "performance_test_runs_status_idx" ON "performance_test_runs"("status");
CREATE INDEX "performance_test_runs_createdAt_idx" ON "performance_test_runs"("createdAt");
CREATE INDEX "performance_test_runs_triggeredByUserId_idx" ON "performance_test_runs"("triggeredByUserId");
CREATE INDEX "dicom_conformance_runs_testKey_idx" ON "dicom_conformance_runs"("testKey");
CREATE INDEX "dicom_conformance_runs_dicomNodeId_idx" ON "dicom_conformance_runs"("dicomNodeId");
CREATE INDEX "dicom_conformance_runs_status_idx" ON "dicom_conformance_runs"("status");
CREATE INDEX "dicom_conformance_runs_createdAt_idx" ON "dicom_conformance_runs"("createdAt");
CREATE INDEX "dicom_conformance_runs_triggeredByUserId_idx" ON "dicom_conformance_runs"("triggeredByUserId");
CREATE INDEX "dicom_conformance_run_items_runId_idx" ON "dicom_conformance_run_items"("runId");
CREATE INDEX "dicom_conformance_run_items_stepKey_idx" ON "dicom_conformance_run_items"("stepKey");
CREATE INDEX "dicom_conformance_run_items_status_idx" ON "dicom_conformance_run_items"("status");
CREATE INDEX "native_connector_events_actionKey_idx" ON "native_connector_events"("actionKey");
CREATE INDEX "native_connector_events_status_idx" ON "native_connector_events"("status");
CREATE INDEX "native_connector_events_actorUserId_idx" ON "native_connector_events"("actorUserId");
CREATE INDEX "native_connector_events_targetType_targetId_idx" ON "native_connector_events"("targetType", "targetId");
CREATE INDEX "native_connector_events_createdAt_idx" ON "native_connector_events"("createdAt");

ALTER TABLE "system_health_check_runs" ADD CONSTRAINT "system_health_check_runs_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "system_health_check_items" ADD CONSTRAINT "system_health_check_items_runId_fkey" FOREIGN KEY ("runId") REFERENCES "system_health_check_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "security_audit_runs" ADD CONSTRAINT "security_audit_runs_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "security_audit_findings" ADD CONSTRAINT "security_audit_findings_runId_fkey" FOREIGN KEY ("runId") REFERENCES "security_audit_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "security_audit_findings" ADD CONSTRAINT "security_audit_findings_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "performance_test_runs" ADD CONSTRAINT "performance_test_runs_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dicom_conformance_runs" ADD CONSTRAINT "dicom_conformance_runs_dicomNodeId_fkey" FOREIGN KEY ("dicomNodeId") REFERENCES "dicom_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dicom_conformance_runs" ADD CONSTRAINT "dicom_conformance_runs_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dicom_conformance_run_items" ADD CONSTRAINT "dicom_conformance_run_items_runId_fkey" FOREIGN KEY ("runId") REFERENCES "dicom_conformance_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "native_connector_events" ADD CONSTRAINT "native_connector_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
