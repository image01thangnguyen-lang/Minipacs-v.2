-- AlterTable
ALTER TABLE "imaging_studies" ADD COLUMN "sourceType" TEXT DEFAULT 'DICOM',
ADD COLUMN "isNonDicom" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "mediaCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "videoCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "attachmentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "primaryMediaId" TEXT,
ADD COLUMN "captureStartedAt" TIMESTAMP(3),
ADD COLUMN "captureCompletedAt" TIMESTAMP(3),
ADD COLUMN "captureStatus" TEXT;

-- CreateTable
CREATE TABLE "non_dicom_exams" (
    "id" TEXT NOT NULL,
    "caseCode" TEXT NOT NULL,
    "imagingStudyId" TEXT,
    "studyInstanceUid" TEXT,
    "worklistOrderId" TEXT,
    "patientId" TEXT,
    "patientName" TEXT,
    "patientBirthDate" TIMESTAMP(3),
    "patientSex" TEXT,
    "accessionNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "facilityId" TEXT,
    "machineId" TEXT,
    "procedureCatalogId" TEXT,
    "serviceTypeId" TEXT,
    "assignedDoctorId" TEXT,
    "technologistId" TEXT,
    "clinicalInfo" TEXT,
    "indication" TEXT,
    "captureStartedAt" TIMESTAMP(3),
    "captureCompletedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "non_dicom_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "non_dicom_media" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studyInstanceUid" TEXT,
    "mediaType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "filePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "mimeType" TEXT,
    "fileSizeBytes" BIGINT,
    "durationMs" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "captureDeviceId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "cropRectJson" TEXT,
    "metadataJson" TEXT,
    "copiedFromMediaId" TEXT,
    "createdByUserId" TEXT,
    "voidedByUserId" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "non_dicom_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "non_dicom_capture_sessions" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "startedByUserId" TEXT,
    "deviceLabel" TEXT,
    "deviceIdHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'STARTED',
    "failureReason" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stoppedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "non_dicom_capture_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "non_dicom_exams_caseCode_key" ON "non_dicom_exams"("caseCode");

-- CreateIndex
CREATE UNIQUE INDEX "non_dicom_exams_imagingStudyId_key" ON "non_dicom_exams"("imagingStudyId");

-- CreateIndex
CREATE UNIQUE INDEX "non_dicom_exams_worklistOrderId_key" ON "non_dicom_exams"("worklistOrderId");

-- CreateIndex
CREATE INDEX "non_dicom_exams_status_idx" ON "non_dicom_exams"("status");

-- CreateIndex
CREATE INDEX "non_dicom_exams_machineId_idx" ON "non_dicom_exams"("machineId");

-- CreateIndex
CREATE INDEX "non_dicom_exams_assignedDoctorId_idx" ON "non_dicom_exams"("assignedDoctorId");

-- CreateIndex
CREATE INDEX "non_dicom_exams_technologistId_idx" ON "non_dicom_exams"("technologistId");

-- CreateIndex
CREATE INDEX "non_dicom_exams_procedureCatalogId_idx" ON "non_dicom_exams"("procedureCatalogId");

-- CreateIndex
CREATE INDEX "non_dicom_exams_createdAt_idx" ON "non_dicom_exams"("createdAt");

-- CreateIndex
CREATE INDEX "non_dicom_exams_accessionNumber_idx" ON "non_dicom_exams"("accessionNumber");

-- CreateIndex
CREATE INDEX "non_dicom_exams_caseCode_idx" ON "non_dicom_exams"("caseCode");

-- CreateIndex
CREATE INDEX "non_dicom_media_examId_idx" ON "non_dicom_media"("examId");

-- CreateIndex
CREATE INDEX "non_dicom_media_mediaType_idx" ON "non_dicom_media"("mediaType");

-- CreateIndex
CREATE INDEX "non_dicom_media_status_idx" ON "non_dicom_media"("status");

-- CreateIndex
CREATE INDEX "non_dicom_media_createdAt_idx" ON "non_dicom_media"("createdAt");

-- CreateIndex
CREATE INDEX "non_dicom_capture_sessions_examId_idx" ON "non_dicom_capture_sessions"("examId");

-- CreateIndex
CREATE INDEX "non_dicom_capture_sessions_status_idx" ON "non_dicom_capture_sessions"("status");

-- AddForeignKey
ALTER TABLE "non_dicom_exams" ADD CONSTRAINT "non_dicom_exams_imagingStudyId_fkey" FOREIGN KEY ("imagingStudyId") REFERENCES "imaging_studies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_dicom_media" ADD CONSTRAINT "non_dicom_media_examId_fkey" FOREIGN KEY ("examId") REFERENCES "non_dicom_exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_dicom_capture_sessions" ADD CONSTRAINT "non_dicom_capture_sessions_examId_fkey" FOREIGN KEY ("examId") REFERENCES "non_dicom_exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
