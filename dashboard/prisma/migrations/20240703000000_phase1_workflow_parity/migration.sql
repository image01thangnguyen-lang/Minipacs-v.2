-- AlterEnum
ALTER TYPE "ReportStatus" ADD VALUE 'PENDING_APPROVAL';

-- AlterTable
ALTER TABLE "imaging_studies" 
ADD COLUMN "clinicalInfo" TEXT,
ADD COLUMN "procedureCode" TEXT,
ADD COLUMN "procedureDescription" TEXT,
ADD COLUMN "technologistId" TEXT;

-- AlterTable
ALTER TABLE "reports" 
ADD COLUMN "clinicalInfo" TEXT,
ADD COLUMN "technique" TEXT,
ADD COLUMN "technologistId" TEXT,
ADD COLUMN "printTemplateId" TEXT,
ADD COLUMN "finalizedAt" TIMESTAMP(3),
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelReason" TEXT,
ADD COLUMN "reopenReason" TEXT;

-- AlterTable
ALTER TABLE "report_addenda" 
ADD COLUMN "reason" TEXT;

-- Data Migration for ReportStatus
UPDATE "reports" SET "status" = 'DRAFT' WHERE "status" = 'DRAFTING' OR "status" = 'UNREAD';
UPDATE "reports" SET "status" = 'FINAL' WHERE "status" = 'COMPLETED';

-- Remove old enum values by renaming type and recreating (PostgreSQL workaround)
ALTER TABLE "reports" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "reports" ALTER COLUMN "status" TYPE TEXT;
DROP TYPE "ReportStatus";
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'FINAL');
ALTER TABLE "reports" ALTER COLUMN "status" TYPE "ReportStatus" USING ("status"::text::"ReportStatus");
ALTER TABLE "reports" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"ReportStatus";
