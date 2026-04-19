ALTER TABLE "FieldGroup"
  ADD COLUMN IF NOT EXISTS "startsOn" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "endsOn" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "FieldGroup_campaignId_idx" ON "FieldGroup"("campaignId");
CREATE INDEX IF NOT EXISTS "FieldGroup_cropId_idx" ON "FieldGroup"("cropId");
