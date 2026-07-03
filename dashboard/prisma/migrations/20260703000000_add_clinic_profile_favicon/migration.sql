-- dashboard/prisma/migrations/20260703000000_add_clinic_profile_favicon/migration.sql
ALTER TABLE "clinic_profiles"
ADD COLUMN IF NOT EXISTS "faviconPath" TEXT;
