-- CreateTable
CREATE TABLE "viewer_snapshots" (
    "id" TEXT NOT NULL,
    "studyInstanceUid" TEXT NOT NULL,
    "seriesInstanceUid" TEXT,
    "sopInstanceUid" TEXT,
    "frameNumber" INTEGER,
    "imageIndex" INTEGER,
    "imageCount" INTEGER,
    "modality" TEXT,
    "bodyPartExamined" TEXT,
    "seriesDescription" TEXT,
    "viewportState" TEXT,
    "windowWidth" DOUBLE PRECISION,
    "windowCenter" DOUBLE PRECISION,
    "zoom" DOUBLE PRECISION,
    "displaySetInstanceUID" TEXT,
    "note" TEXT,
    "imageUrl" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "viewer_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viewer_key_images" (
    "id" TEXT NOT NULL,
    "studyInstanceUid" TEXT NOT NULL,
    "seriesInstanceUid" TEXT,
    "sopInstanceUid" TEXT,
    "frameNumber" INTEGER,
    "imageIndex" INTEGER,
    "imageCount" INTEGER,
    "modality" TEXT,
    "bodyPartExamined" TEXT,
    "seriesDescription" TEXT,
    "viewportState" TEXT,
    "windowWidth" DOUBLE PRECISION,
    "windowCenter" DOUBLE PRECISION,
    "zoom" DOUBLE PRECISION,
    "displaySetInstanceUID" TEXT,
    "note" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "viewer_key_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viewer_audit_logs" (
    "id" TEXT NOT NULL,
    "studyInstanceUid" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadataJson" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "viewer_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "viewer_snapshots_studyInstanceUid_idx" ON "viewer_snapshots"("studyInstanceUid");

-- CreateIndex
CREATE INDEX "viewer_snapshots_createdAt_idx" ON "viewer_snapshots"("createdAt");

-- CreateIndex
CREATE INDEX "viewer_key_images_studyInstanceUid_idx" ON "viewer_key_images"("studyInstanceUid");

-- CreateIndex
CREATE INDEX "viewer_key_images_createdAt_idx" ON "viewer_key_images"("createdAt");

-- CreateIndex
CREATE INDEX "viewer_audit_logs_studyInstanceUid_idx" ON "viewer_audit_logs"("studyInstanceUid");

-- CreateIndex
CREATE INDEX "viewer_audit_logs_action_idx" ON "viewer_audit_logs"("action");

-- CreateIndex
CREATE INDEX "viewer_audit_logs_createdAt_idx" ON "viewer_audit_logs"("createdAt");
