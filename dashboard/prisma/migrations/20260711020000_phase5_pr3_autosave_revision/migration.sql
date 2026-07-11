-- Explicit optimistic-concurrency token for report drafts.
ALTER TABLE "reports" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;