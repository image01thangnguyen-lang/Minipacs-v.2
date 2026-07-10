-- AlterTable
ALTER TABLE "worklist_orders" ADD COLUMN "performingUnitId" TEXT;
CREATE INDEX "worklist_orders_performingUnitId_scheduledDate_status_idx" ON "worklist_orders"("performingUnitId", "scheduledDate", "status");
CREATE INDEX "worklist_orders_performingUnitId_createdAt_status_idx" ON "worklist_orders"("performingUnitId", "createdAt", "status");

-- AlterTable
ALTER TABLE "imaging_studies" ADD COLUMN "performingUnitId" TEXT;
CREATE INDEX "imaging_studies_performingUnitId_createdAt_status_idx" ON "imaging_studies"("performingUnitId", "createdAt", "status");

-- CreateTable
CREATE TABLE "access_scope_grants" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "roleProfileId" TEXT,
    "facilityUnitId" TEXT,
    "dicomNodeId" TEXT,
    "capability" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "includeDescendants" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "reason" TEXT,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_scope_grants_pkey" PRIMARY KEY ("id")
);

-- Check constraints
ALTER TABLE "access_scope_grants" ADD CONSTRAINT "chk_principal" CHECK (
    ("userId" IS NOT NULL AND "roleProfileId" IS NULL) OR
    ("userId" IS NULL AND "roleProfileId" IS NOT NULL)
);

ALTER TABLE "access_scope_grants" ADD CONSTRAINT "chk_scope" CHECK (
    ("facilityUnitId" IS NOT NULL AND "dicomNodeId" IS NULL) OR
    ("facilityUnitId" IS NULL AND "dicomNodeId" IS NOT NULL)
);

ALTER TABLE "access_scope_grants" ADD CONSTRAINT "chk_effect" CHECK ("effect" IN ('ALLOW', 'DENY'));

ALTER TABLE "access_scope_grants" ADD CONSTRAINT "chk_validity" CHECK ("validUntil" IS NULL OR "validFrom" IS NULL OR "validUntil" > "validFrom");

ALTER TABLE "access_scope_grants" ADD CONSTRAINT "chk_machine_descendants" CHECK (
    "dicomNodeId" IS NULL OR "includeDescendants" = false
);

-- Partial Unique Indexes
CREATE UNIQUE INDEX "idx_grant_user_facility" ON "access_scope_grants"("userId", "facilityUnitId", "capability") WHERE "userId" IS NOT NULL AND "facilityUnitId" IS NOT NULL;
CREATE UNIQUE INDEX "idx_grant_user_machine" ON "access_scope_grants"("userId", "dicomNodeId", "capability") WHERE "userId" IS NOT NULL AND "dicomNodeId" IS NOT NULL;
CREATE UNIQUE INDEX "idx_grant_role_facility" ON "access_scope_grants"("roleProfileId", "facilityUnitId", "capability") WHERE "roleProfileId" IS NOT NULL AND "facilityUnitId" IS NOT NULL;
CREATE UNIQUE INDEX "idx_grant_role_machine" ON "access_scope_grants"("roleProfileId", "dicomNodeId", "capability") WHERE "roleProfileId" IS NOT NULL AND "dicomNodeId" IS NOT NULL;

-- Foreign keys
ALTER TABLE "worklist_orders" ADD CONSTRAINT "worklist_orders_performingUnitId_fkey" FOREIGN KEY ("performingUnitId") REFERENCES "facility_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "imaging_studies" ADD CONSTRAINT "imaging_studies_performingUnitId_fkey" FOREIGN KEY ("performingUnitId") REFERENCES "facility_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "access_scope_grants" ADD CONSTRAINT "access_scope_grants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_scope_grants" ADD CONSTRAINT "access_scope_grants_roleProfileId_fkey" FOREIGN KEY ("roleProfileId") REFERENCES "app_role_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_scope_grants" ADD CONSTRAINT "access_scope_grants_facilityUnitId_fkey" FOREIGN KEY ("facilityUnitId") REFERENCES "facility_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_scope_grants" ADD CONSTRAINT "access_scope_grants_dicomNodeId_fkey" FOREIGN KEY ("dicomNodeId") REFERENCES "dicom_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Default Indexes
CREATE INDEX "access_scope_grants_userId_capability_effect_idx" ON "access_scope_grants"("userId", "capability", "effect");
CREATE INDEX "access_scope_grants_roleProfileId_capability_effect_idx" ON "access_scope_grants"("roleProfileId", "capability", "effect");
CREATE INDEX "access_scope_grants_facilityUnitId_capability_idx" ON "access_scope_grants"("facilityUnitId", "capability");
CREATE INDEX "access_scope_grants_dicomNodeId_capability_idx" ON "access_scope_grants"("dicomNodeId", "capability");
CREATE INDEX "access_scope_grants_validFrom_validUntil_idx" ON "access_scope_grants"("validFrom", "validUntil");
