-- CreateTable
CREATE TABLE "release_candidates" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,

    CONSTRAINT "release_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release_signoffs" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "signedByUserId" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "release_signoffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release_known_issues" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "ticketId" TEXT,
    "description" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "workaround" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "release_known_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uat_suites" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uat_suites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uat_cases" (
    "id" TEXT NOT NULL,
    "suiteId" TEXT NOT NULL,
    "category" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "expected" TEXT NOT NULL,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uat_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uat_runs" (
    "id" TEXT NOT NULL,
    "suiteId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "testedByUserId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "uat_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uat_results" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "testedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uat_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uat_evidences" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER,
    "evidenceKind" TEXT NOT NULL DEFAULT 'UPLOAD',
    "isScrubbed" BOOLEAN NOT NULL DEFAULT false,
    "containsPhiRisk" BOOLEAN NOT NULL DEFAULT false,
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uat_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "golive_checklists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "golive_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "golive_checklist_items" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "assignedToUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "golive_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_materials" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "roleTarget" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_assignments" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attestedAt" TIMESTAMP(3),
    "attestedByUserId" TEXT,
    "auditReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_tickets" (
    "id" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "contextType" TEXT,
    "contextId" TEXT,
    "contextUrl" TEXT,
    "shortDesc" TEXT NOT NULL,
    "reportedByUserId" TEXT,
    "assigneeUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "incident_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_comments" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "wasRedacted" BOOLEAN NOT NULL DEFAULT false,
    "redactionNotes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_requests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "module" TEXT NOT NULL DEFAULT 'GENERAL',
    "impactSummary" TEXT,
    "rollbackPlan" TEXT,
    "uatRequired" BOOLEAN NOT NULL DEFAULT false,
    "releaseNotesImpact" TEXT,
    "status" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "releaseId" TEXT,
    "uatSuiteId" TEXT,
    "incidentId" TEXT,
    "requestedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_approvals" (
    "id" TEXT NOT NULL,
    "changeId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "reviewerUserId" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runbooks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "runbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runbook_steps" (
    "id" TEXT NOT NULL,
    "runbookId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isRisky" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,

    CONSTRAINT "runbook_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runbook_executions" (
    "id" TEXT NOT NULL,
    "runbookId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "executedByUserId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "logJson" TEXT,
    "activeKey" TEXT,

    CONSTRAINT "runbook_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "release_candidates_version_key" ON "release_candidates"("version");

-- CreateIndex
CREATE INDEX "release_candidates_status_idx" ON "release_candidates"("status");

-- CreateIndex
CREATE INDEX "release_candidates_createdAt_idx" ON "release_candidates"("createdAt");

-- CreateIndex
CREATE INDEX "release_signoffs_releaseId_idx" ON "release_signoffs"("releaseId");

-- CreateIndex
CREATE UNIQUE INDEX "release_signoffs_releaseId_role_key" ON "release_signoffs"("releaseId", "role");

-- CreateIndex
CREATE INDEX "release_known_issues_releaseId_idx" ON "release_known_issues"("releaseId");

-- CreateIndex
CREATE INDEX "uat_cases_suiteId_idx" ON "uat_cases"("suiteId");

-- CreateIndex
CREATE INDEX "uat_runs_suiteId_idx" ON "uat_runs"("suiteId");

-- CreateIndex
CREATE INDEX "uat_runs_status_idx" ON "uat_runs"("status");

-- CreateIndex
CREATE INDEX "uat_results_runId_idx" ON "uat_results"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "uat_results_runId_caseId_key" ON "uat_results"("runId", "caseId");

-- CreateIndex
CREATE INDEX "uat_evidences_resultId_idx" ON "uat_evidences"("resultId");

-- CreateIndex
CREATE INDEX "uat_evidences_containsPhiRisk_idx" ON "uat_evidences"("containsPhiRisk");

-- CreateIndex
CREATE INDEX "golive_checklist_items_checklistId_idx" ON "golive_checklist_items"("checklistId");

-- CreateIndex
CREATE INDEX "golive_checklist_items_category_idx" ON "golive_checklist_items"("category");

-- CreateIndex
CREATE INDEX "training_assignments_userId_idx" ON "training_assignments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "training_assignments_materialId_userId_key" ON "training_assignments"("materialId", "userId");

-- CreateIndex
CREATE INDEX "incident_tickets_status_idx" ON "incident_tickets"("status");

-- CreateIndex
CREATE INDEX "incident_tickets_severity_idx" ON "incident_tickets"("severity");

-- CreateIndex
CREATE INDEX "incident_tickets_module_idx" ON "incident_tickets"("module");

-- CreateIndex
CREATE INDEX "incident_tickets_reportedByUserId_idx" ON "incident_tickets"("reportedByUserId");

-- CreateIndex
CREATE INDEX "incident_comments_ticketId_idx" ON "incident_comments"("ticketId");

-- CreateIndex
CREATE INDEX "change_requests_status_idx" ON "change_requests"("status");

-- CreateIndex
CREATE INDEX "change_requests_releaseId_idx" ON "change_requests"("releaseId");

-- CreateIndex
CREATE INDEX "change_requests_uatSuiteId_idx" ON "change_requests"("uatSuiteId");

-- CreateIndex
CREATE INDEX "change_requests_incidentId_idx" ON "change_requests"("incidentId");

-- CreateIndex
CREATE INDEX "change_approvals_changeId_idx" ON "change_approvals"("changeId");

-- CreateIndex
CREATE UNIQUE INDEX "change_approvals_changeId_reviewerUserId_key" ON "change_approvals"("changeId", "reviewerUserId");

-- CreateIndex
CREATE INDEX "runbook_steps_runbookId_idx" ON "runbook_steps"("runbookId");

-- CreateIndex
CREATE UNIQUE INDEX "runbook_steps_runbookId_order_key" ON "runbook_steps"("runbookId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "runbook_executions_activeKey_key" ON "runbook_executions"("activeKey");

-- CreateIndex
CREATE INDEX "runbook_executions_runbookId_idx" ON "runbook_executions"("runbookId");

-- CreateIndex
CREATE INDEX "runbook_executions_status_idx" ON "runbook_executions"("status");

-- AddForeignKey
ALTER TABLE "release_candidates" ADD CONSTRAINT "release_candidates_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_signoffs" ADD CONSTRAINT "release_signoffs_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "release_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_signoffs" ADD CONSTRAINT "release_signoffs_signedByUserId_fkey" FOREIGN KEY ("signedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_known_issues" ADD CONSTRAINT "release_known_issues_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "release_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uat_cases" ADD CONSTRAINT "uat_cases_suiteId_fkey" FOREIGN KEY ("suiteId") REFERENCES "uat_suites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uat_runs" ADD CONSTRAINT "uat_runs_suiteId_fkey" FOREIGN KEY ("suiteId") REFERENCES "uat_suites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uat_runs" ADD CONSTRAINT "uat_runs_testedByUserId_fkey" FOREIGN KEY ("testedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uat_results" ADD CONSTRAINT "uat_results_runId_fkey" FOREIGN KEY ("runId") REFERENCES "uat_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uat_results" ADD CONSTRAINT "uat_results_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "uat_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uat_evidences" ADD CONSTRAINT "uat_evidences_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "uat_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uat_evidences" ADD CONSTRAINT "uat_evidences_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "golive_checklist_items" ADD CONSTRAINT "golive_checklist_items_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "golive_checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "golive_checklist_items" ADD CONSTRAINT "golive_checklist_items_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "training_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_attestedByUserId_fkey" FOREIGN KEY ("attestedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_tickets" ADD CONSTRAINT "incident_tickets_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_tickets" ADD CONSTRAINT "incident_tickets_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_comments" ADD CONSTRAINT "incident_comments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "incident_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_comments" ADD CONSTRAINT "incident_comments_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "release_candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_uatSuiteId_fkey" FOREIGN KEY ("uatSuiteId") REFERENCES "uat_suites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incident_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_approvals" ADD CONSTRAINT "change_approvals_changeId_fkey" FOREIGN KEY ("changeId") REFERENCES "change_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_approvals" ADD CONSTRAINT "change_approvals_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runbook_steps" ADD CONSTRAINT "runbook_steps_runbookId_fkey" FOREIGN KEY ("runbookId") REFERENCES "runbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runbook_executions" ADD CONSTRAINT "runbook_executions_runbookId_fkey" FOREIGN KEY ("runbookId") REFERENCES "runbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runbook_executions" ADD CONSTRAINT "runbook_executions_executedByUserId_fkey" FOREIGN KEY ("executedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

