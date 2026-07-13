-- Phase 13 PR 13.1/13.2 additive, dark-launched clinical governance schema.
ALTER TABLE "peer_reviews"
  ADD COLUMN "programId" TEXT,
  ADD COLUMN "programVersion" INTEGER,
  ADD COLUMN "reportRevision" INTEGER,
  ADD COLUMN "samplingKey" TEXT,
  ADD COLUMN "dueDate" TIMESTAMP(3);

CREATE TABLE "peer_review_programs" (
  "id" TEXT NOT NULL, "facilityId" TEXT, "modality" TEXT, "specialty" TEXT,
  "samplePercentage" DOUBLE PRECISION NOT NULL, "version" INTEGER NOT NULL DEFAULT 1,
  "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "peer_review_programs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "peer_review_programs_sample_percentage_check" CHECK ("samplePercentage" >= 0 AND "samplePercentage" <= 100),
  CONSTRAINT "peer_review_programs_version_check" CHECK ("version" > 0)
);
CREATE UNIQUE INDEX "peer_review_programs_facilityId_modality_specialty_version_key" ON "peer_review_programs"("facilityId", "modality", "specialty", "version");
CREATE INDEX "peer_review_programs_facilityId_modality_specialty_idx" ON "peer_review_programs"("facilityId", "modality", "specialty");

CREATE TABLE "peer_review_exclusion_rules" (
  "id" TEXT NOT NULL, "programId" TEXT NOT NULL, "excludeDoctorId" TEXT, "excludeProcedure" TEXT,
  "reason" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "peer_review_exclusion_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "peer_review_exclusion_rules_programId_idx" ON "peer_review_exclusion_rules"("programId");
CREATE UNIQUE INDEX "peer_reviews_samplingKey_key" ON "peer_reviews"("samplingKey");
CREATE INDEX "peer_reviews_programId_idx" ON "peer_reviews"("programId");
CREATE INDEX "peer_reviews_studyInstanceUid_idx" ON "peer_reviews"("studyInstanceUid");
ALTER TABLE "peer_reviews" ADD CONSTRAINT "peer_reviews_programId_fkey" FOREIGN KEY ("programId") REFERENCES "peer_review_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "peer_review_exclusion_rules" ADD CONSTRAINT "peer_review_exclusion_rules_programId_fkey" FOREIGN KEY ("programId") REFERENCES "peer_review_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "quality_committees" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "facilityId" TEXT, "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "quality_committees_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "quality_committees_facilityId_idx" ON "quality_committees"("facilityId");
CREATE TABLE "quality_committee_members" (
  "id" TEXT NOT NULL, "committeeId" TEXT NOT NULL, "userId" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'MEMBER',
  "isActive" BOOLEAN NOT NULL DEFAULT true, "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quality_committee_members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "quality_committee_members_role_check" CHECK ("role" IN ('CHAIR','MEMBER','SECRETARY'))
);
CREATE UNIQUE INDEX "quality_committee_members_committeeId_userId_key" ON "quality_committee_members"("committeeId", "userId");
ALTER TABLE "quality_committee_members" ADD CONSTRAINT "quality_committee_members_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "quality_committees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "capa_cases" (
  "id" TEXT NOT NULL, "committeeId" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'OPEN', "title" TEXT NOT NULL,
  "description" TEXT, "evidenceJson" TEXT, "peerReviewId" TEXT, "closedAt" TIMESTAMP(3), "closedByUserId" TEXT,
  "closureReason" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "capa_cases_pkey" PRIMARY KEY ("id"), CONSTRAINT "capa_cases_status_check" CHECK ("status" IN ('OPEN','INVESTIGATING','CLOSED'))
);
CREATE INDEX "capa_cases_committeeId_idx" ON "capa_cases"("committeeId");
CREATE INDEX "capa_cases_status_idx" ON "capa_cases"("status");
CREATE INDEX "capa_cases_peerReviewId_idx" ON "capa_cases"("peerReviewId");
ALTER TABLE "capa_cases" ADD CONSTRAINT "capa_cases_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "quality_committees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "capa_cases" ADD CONSTRAINT "capa_cases_peerReviewId_fkey" FOREIGN KEY ("peerReviewId") REFERENCES "peer_reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "capa_actions" (
  "id" TEXT NOT NULL, "caseId" TEXT NOT NULL, "ownerUserId" TEXT NOT NULL, "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING', "dueDate" TIMESTAMP(3), "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "capa_actions_pkey" PRIMARY KEY ("id"), CONSTRAINT "capa_actions_status_check" CHECK ("status" IN ('PENDING','COMPLETED','CANCELLED'))
);
CREATE INDEX "capa_actions_caseId_idx" ON "capa_actions"("caseId");
CREATE INDEX "capa_actions_ownerUserId_idx" ON "capa_actions"("ownerUserId");
ALTER TABLE "capa_actions" ADD CONSTRAINT "capa_actions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "capa_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "capa_transitions" (
  "id" TEXT NOT NULL, "caseId" TEXT NOT NULL, "fromStatus" TEXT NOT NULL, "toStatus" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL, "evidence" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "capa_transitions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "capa_transitions_caseId_createdAt_idx" ON "capa_transitions"("caseId", "createdAt");
ALTER TABLE "capa_transitions" ADD CONSTRAINT "capa_transitions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "capa_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;