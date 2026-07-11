-- Additive per-user workspace preferences. Existing users retain application defaults.
CREATE TABLE "workspace_user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "preferencesJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_user_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspace_user_preferences_userId_key"
    ON "workspace_user_preferences"("userId");

ALTER TABLE "workspace_user_preferences"
    ADD CONSTRAINT "workspace_user_preferences_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;