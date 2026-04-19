ALTER TABLE "Field"
  ADD COLUMN IF NOT EXISTS "municipality" TEXT NOT NULL DEFAULT 'NON DEFINITO',
  ADD COLUMN IF NOT EXISTS "cadastralAreaSqm" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "Field"
  ALTER COLUMN "commonName" DROP NOT NULL;

ALTER TABLE "Field"
  DROP COLUMN IF EXISTS "cadastralAreaHa",
  DROP COLUMN IF EXISTS "cultivatedAreaHa";

DROP INDEX IF EXISTS "Field_cadastralSheet_cadastralParcel_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Field_municipality_cadastralSheet_cadastralParcel_key"
  ON "Field"("municipality", "cadastralSheet", "cadastralParcel");

CREATE INDEX IF NOT EXISTS "Field_municipality_idx" ON "Field"("municipality");
CREATE INDEX IF NOT EXISTS "Field_commonName_idx" ON "Field"("commonName");

ALTER TABLE "FieldPacHistory"
  ADD COLUMN IF NOT EXISTS "changedByUserId" TEXT;

ALTER TABLE "FieldPacHistory"
  ALTER COLUMN "included" DROP NOT NULL,
  ALTER COLUMN "included" DROP DEFAULT;

CREATE INDEX IF NOT EXISTS "FieldPacHistory_year_idx" ON "FieldPacHistory"("year");

CREATE TABLE IF NOT EXISTS "FieldUsageHistory" (
  "id" TEXT NOT NULL,
  "fieldId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "usedAreaSqm" DECIMAL(12, 2) NOT NULL,
  "note" TEXT,
  "changedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FieldUsageHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FieldUsageHistory_fieldId_year_key"
  ON "FieldUsageHistory"("fieldId", "year");

CREATE INDEX IF NOT EXISTS "FieldUsageHistory_year_idx" ON "FieldUsageHistory"("year");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FieldUsageHistory_fieldId_fkey'
  ) THEN
    ALTER TABLE "FieldUsageHistory"
      ADD CONSTRAINT "FieldUsageHistory_fieldId_fkey"
      FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
