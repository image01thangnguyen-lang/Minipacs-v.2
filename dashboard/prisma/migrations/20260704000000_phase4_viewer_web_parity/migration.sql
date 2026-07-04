-- AlterTable
ALTER TABLE "viewer_snapshots" ADD COLUMN "thumbnailUrl" TEXT;
ALTER TABLE "viewer_snapshots" ADD COLUMN "storageKey" TEXT;
ALTER TABLE "viewer_snapshots" ADD COLUMN "category" TEXT;
ALTER TABLE "viewer_snapshots" ADD COLUMN "sourceType" TEXT;
ALTER TABLE "viewer_snapshots" ADD COLUMN "cropRectJson" TEXT;
ALTER TABLE "viewer_snapshots" ADD COLUMN "cropRatio" DOUBLE PRECISION;
ALTER TABLE "viewer_snapshots" ADD COLUMN "isFullViewport" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "viewer_snapshots" ADD COLUMN "includeOverlay" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "viewer_snapshots" ADD COLUMN "isAnonymized" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "viewer_snapshots" ADD COLUMN "metadataJson" TEXT;

-- AlterTable
ALTER TABLE "viewer_key_images" ADD COLUMN "thumbnailUrl" TEXT;
ALTER TABLE "viewer_key_images" ADD COLUMN "storageKey" TEXT;
ALTER TABLE "viewer_key_images" ADD COLUMN "category" TEXT;
ALTER TABLE "viewer_key_images" ADD COLUMN "cropRectJson" TEXT;
ALTER TABLE "viewer_key_images" ADD COLUMN "cropRatio" DOUBLE PRECISION;
ALTER TABLE "viewer_key_images" ADD COLUMN "isSelectedForReport" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "viewer_key_images" ADD COLUMN "isAnonymized" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "viewer_key_images" ADD COLUMN "metadataJson" TEXT;

-- CreateTable
CREATE TABLE "viewer_user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolbarPosition" TEXT,
    "theme" TEXT,
    "hotkeysJson" TEXT,
    "windowLevelPresetsJson" TEXT,
    "layoutDefaultsJson" TEXT,
    "toolVisibilityJson" TEXT,
    "overlayFieldsJson" TEXT,
    "seriesRailJson" TEXT,
    "anonymizeDefault" BOOLEAN NOT NULL DEFAULT false,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viewer_user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viewer_download_jobs" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "studyInstanceUid" TEXT NOT NULL,
    "seriesInstanceUid" TEXT,
    "requestedByUserId" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "fileName" TEXT,
    "filePath" TEXT,
    "fileSizeBytes" BIGINT,
    "mimeType" TEXT,
    "expiresAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "anonymize" BOOLEAN NOT NULL DEFAULT false,
    "includePatientInfo" BOOLEAN NOT NULL DEFAULT true,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "viewer_download_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viewer_series_action_requests" (
    "id" TEXT NOT NULL,
    "studyInstanceUid" TEXT NOT NULL,
    "seriesInstanceUid" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "requestedByUserId" TEXT,
    "approvedByUserId" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viewer_series_action_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "viewer_user_preferences_userId_key" ON "viewer_user_preferences"("userId");

-- CreateIndex
CREATE INDEX "viewer_download_jobs_studyInstanceUid_idx" ON "viewer_download_jobs"("studyInstanceUid");

-- CreateIndex
CREATE INDEX "viewer_download_jobs_requestedByUserId_idx" ON "viewer_download_jobs"("requestedByUserId");

-- CreateIndex
CREATE INDEX "viewer_download_jobs_status_idx" ON "viewer_download_jobs"("status");

-- CreateIndex
CREATE INDEX "viewer_series_action_requests_studyInstanceUid_seriesInstanceUid_idx" ON "viewer_series_action_requests"("studyInstanceUid", "seriesInstanceUid");

-- CreateIndex
CREATE INDEX "viewer_series_action_requests_status_idx" ON "viewer_series_action_requests"("status");

-- AddForeignKey
ALTER TABLE "viewer_user_preferences" ADD CONSTRAINT "viewer_user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewer_download_jobs" ADD CONSTRAINT "viewer_download_jobs_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewer_download_jobs" ADD CONSTRAINT "viewer_download_jobs_studyInstanceUid_fkey" FOREIGN KEY ("studyInstanceUid") REFERENCES "imaging_studies"("studyInstanceUid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewer_series_action_requests" ADD CONSTRAINT "viewer_series_action_requests_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewer_series_action_requests" ADD CONSTRAINT "viewer_series_action_requests_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewer_series_action_requests" ADD CONSTRAINT "viewer_series_action_requests_studyInstanceUid_fkey" FOREIGN KEY ("studyInstanceUid") REFERENCES "imaging_studies"("studyInstanceUid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewer_snapshots" ADD CONSTRAINT "viewer_snapshots_studyInstanceUid_fkey" FOREIGN KEY ("studyInstanceUid") REFERENCES "imaging_studies"("studyInstanceUid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewer_key_images" ADD CONSTRAINT "viewer_key_images_studyInstanceUid_fkey" FOREIGN KEY ("studyInstanceUid") REFERENCES "imaging_studies"("studyInstanceUid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewer_audit_logs" ADD CONSTRAINT "viewer_audit_logs_studyInstanceUid_fkey" FOREIGN KEY ("studyInstanceUid") REFERENCES "imaging_studies"("studyInstanceUid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewer_audit_logs" ADD CONSTRAINT "viewer_audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


