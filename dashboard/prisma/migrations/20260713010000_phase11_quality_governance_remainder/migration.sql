-- Phase 11 quality/governance remainder.
-- The Phase 11 foundation migration creates alert, SLA, threshold-policy and
-- critical-result structures. This migration adds the remaining persisted
-- quality workflow and analytics models used by the application services.

CREATE TABLE "threshold_evaluation_results" (
    "id" TEXT NOT NULL,
    "policyId" TEXT,
    "metricKey" TEXT NOT NULL,
    "groupKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "actualValue" DOUBLE PRECISION,
    "thresholdValue" DOUBLE PRECISION,
    "unit" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "studyInstanceUid" TEXT,
    "message" TEXT,
    "metadataJson" TEXT,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "threshold_evaluation_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quality_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "studyInstanceUid" TEXT,
    "reportId" TEXT,
    "worklistOrderId" TEXT,
    "nonDicomExamId" TEXT,
    "mediaId" TEXT,
    "assignedToUserId" TEXT,
    "createdByUserId" TEXT,
    "acknowledgedByUserId" TEXT,
    "resolvedByUserId" TEXT,
    "reasonCode" TEXT,
    "description" TEXT,
    "metadataJson" TEXT,
    "dueAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "peer_reviews" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "studyInstanceUid" TEXT NOT NULL,
    "reviewerUserId" TEXT NOT NULL,
    "originalDoctorId" TEXT,
    "status" TEXT NOT NULL,
    "result" TEXT,
    "comment" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "peer_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "qc_issues" (
    "id" TEXT NOT NULL,
    "studyInstanceUid" TEXT,
    "nonDicomExamId" TEXT,
    "mediaId" TEXT,
    "dicomNodeId" TEXT,
    "status" TEXT NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "description" TEXT,
    "requiresRescan" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_issues_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "data_quality_issues" (
    "id" TEXT NOT NULL,
    "issueKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "studyInstanceUid" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "suppressedUntil" TIMESTAMP(3),
    "metadataJson" TEXT,

    CONSTRAINT "data_quality_issues_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "metric_snapshots" (
    "id" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "valueJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "threshold_evaluation_results_policyId_idx" ON "threshold_evaluation_results"("policyId");
CREATE INDEX "threshold_evaluation_results_metricKey_idx" ON "threshold_evaluation_results"("metricKey");
CREATE INDEX "threshold_evaluation_results_status_idx" ON "threshold_evaluation_results"("status");
CREATE INDEX "threshold_evaluation_results_evaluatedAt_idx" ON "threshold_evaluation_results"("evaluatedAt");

CREATE INDEX "quality_events_studyInstanceUid_idx" ON "quality_events"("studyInstanceUid");
CREATE INDEX "quality_events_reportId_idx" ON "quality_events"("reportId");
CREATE INDEX "quality_events_status_idx" ON "quality_events"("status");
CREATE INDEX "quality_events_createdAt_idx" ON "quality_events"("createdAt");

CREATE INDEX "peer_reviews_reportId_idx" ON "peer_reviews"("reportId");
CREATE INDEX "peer_reviews_status_idx" ON "peer_reviews"("status");

CREATE INDEX "qc_issues_studyInstanceUid_idx" ON "qc_issues"("studyInstanceUid");
CREATE INDEX "qc_issues_status_idx" ON "qc_issues"("status");
CREATE INDEX "qc_issues_createdAt_idx" ON "qc_issues"("createdAt");

CREATE INDEX "data_quality_issues_status_idx" ON "data_quality_issues"("status");
CREATE INDEX "data_quality_issues_entityType_entityId_idx" ON "data_quality_issues"("entityType", "entityId");
CREATE INDEX "data_quality_issues_issueKey_idx" ON "data_quality_issues"("issueKey");

CREATE INDEX "metric_snapshots_metricKey_idx" ON "metric_snapshots"("metricKey");
CREATE INDEX "metric_snapshots_scope_scopeId_idx" ON "metric_snapshots"("scope", "scopeId");
CREATE INDEX "metric_snapshots_periodStart_periodEnd_idx" ON "metric_snapshots"("periodStart", "periodEnd");

ALTER TABLE "quality_events" ADD CONSTRAINT "quality_events_studyInstanceUid_fkey" FOREIGN KEY ("studyInstanceUid") REFERENCES "imaging_studies"("studyInstanceUid") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quality_events" ADD CONSTRAINT "quality_events_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quality_events" ADD CONSTRAINT "quality_events_worklistOrderId_fkey" FOREIGN KEY ("worklistOrderId") REFERENCES "worklist_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quality_events" ADD CONSTRAINT "quality_events_nonDicomExamId_fkey" FOREIGN KEY ("nonDicomExamId") REFERENCES "non_dicom_exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quality_events" ADD CONSTRAINT "quality_events_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "non_dicom_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quality_events" ADD CONSTRAINT "quality_events_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quality_events" ADD CONSTRAINT "quality_events_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quality_events" ADD CONSTRAINT "quality_events_acknowledgedByUserId_fkey" FOREIGN KEY ("acknowledgedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quality_events" ADD CONSTRAINT "quality_events_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "peer_reviews" ADD CONSTRAINT "peer_reviews_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "peer_reviews" ADD CONSTRAINT "peer_reviews_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "peer_reviews" ADD CONSTRAINT "peer_reviews_originalDoctorId_fkey" FOREIGN KEY ("originalDoctorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "qc_issues" ADD CONSTRAINT "qc_issues_nonDicomExamId_fkey" FOREIGN KEY ("nonDicomExamId") REFERENCES "non_dicom_exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "qc_issues" ADD CONSTRAINT "qc_issues_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "non_dicom_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "qc_issues" ADD CONSTRAINT "qc_issues_dicomNodeId_fkey" FOREIGN KEY ("dicomNodeId") REFERENCES "dicom_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "qc_issues" ADD CONSTRAINT "qc_issues_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "qc_issues" ADD CONSTRAINT "qc_issues_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "data_quality_issues" ADD CONSTRAINT "data_quality_issues_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;