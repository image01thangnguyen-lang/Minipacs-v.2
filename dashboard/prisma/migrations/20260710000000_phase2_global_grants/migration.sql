-- Drop the old constraint
ALTER TABLE "access_scope_grants" DROP CONSTRAINT "chk_scope";

-- Add the new constraint allowing global grants (both null)
ALTER TABLE "access_scope_grants" ADD CONSTRAINT "chk_scope" CHECK (
    ("facilityUnitId" IS NOT NULL AND "dicomNodeId" IS NULL) OR
    ("facilityUnitId" IS NULL AND "dicomNodeId" IS NOT NULL) OR
    ("facilityUnitId" IS NULL AND "dicomNodeId" IS NULL)
);

-- Add uniqueness protection for user global grants
CREATE UNIQUE INDEX "idx_grant_user_global" ON "access_scope_grants"("userId", "capability") WHERE "userId" IS NOT NULL AND "facilityUnitId" IS NULL AND "dicomNodeId" IS NULL;

-- Add uniqueness protection for role global grants
CREATE UNIQUE INDEX "idx_grant_role_global" ON "access_scope_grants"("roleProfileId", "capability") WHERE "roleProfileId" IS NOT NULL AND "facilityUnitId" IS NULL AND "dicomNodeId" IS NULL;
