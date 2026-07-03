-- AlterTable
ALTER TABLE "reports" ADD COLUMN "hisResultStatus" TEXT;
ALTER TABLE "reports" ADD COLUMN "hisResultSentAt" TIMESTAMP(3);
ALTER TABLE "reports" ADD COLUMN "hisResultMessageId" TEXT;
ALTER TABLE "reports" ADD COLUMN "hisResultError" TEXT;

-- AlterTable
ALTER TABLE "worklist_orders" ADD COLUMN "hisOrderId" TEXT;
ALTER TABLE "worklist_orders" ADD COLUMN "hisPatientId" TEXT;
ALTER TABLE "worklist_orders" ADD COLUMN "hisVisitId" TEXT;
ALTER TABLE "worklist_orders" ADD COLUMN "hisDepartmentCode" TEXT;
ALTER TABLE "worklist_orders" ADD COLUMN "hisSyncStatus" TEXT;
ALTER TABLE "worklist_orders" ADD COLUMN "hisLastSyncedAt" TIMESTAMP(3);
ALTER TABLE "worklist_orders" ADD COLUMN "hisLastError" TEXT;
ALTER TABLE "worklist_orders" ADD COLUMN "hisPayloadJson" TEXT;

-- AlterTable
ALTER TABLE "imaging_studies" ADD COLUMN "hisOrderId" TEXT;
ALTER TABLE "imaging_studies" ADD COLUMN "hisSyncStatus" TEXT;
ALTER TABLE "imaging_studies" ADD COLUMN "hisResultStatus" TEXT;
ALTER TABLE "imaging_studies" ADD COLUMN "hisLastSyncedAt" TIMESTAMP(3);
ALTER TABLE "imaging_studies" ADD COLUMN "hisLastResultSentAt" TIMESTAMP(3);
ALTER TABLE "imaging_studies" ADD COLUMN "hisLastError" TEXT;

-- CreateTable
CREATE TABLE "his_sync_logs" (
    "id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "studyInstanceUid" TEXT,
    "accessionNumber" TEXT,
    "hisOrderId" TEXT,
    "hisMessageId" TEXT,
    "requestSummaryJson" TEXT,
    "responseSummaryJson" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "his_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "his_sync_logs_createdAt_idx" ON "his_sync_logs"("createdAt");
CREATE INDEX "his_sync_logs_studyInstanceUid_idx" ON "his_sync_logs"("studyInstanceUid");
CREATE INDEX "his_sync_logs_accessionNumber_idx" ON "his_sync_logs"("accessionNumber");
CREATE INDEX "his_sync_logs_hisOrderId_idx" ON "his_sync_logs"("hisOrderId");
CREATE INDEX "his_sync_logs_status_idx" ON "his_sync_logs"("status");
CREATE INDEX "his_sync_logs_action_idx" ON "his_sync_logs"("action");
