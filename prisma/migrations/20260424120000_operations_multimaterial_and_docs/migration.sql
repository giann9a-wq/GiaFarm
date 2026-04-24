-- AlterTable
ALTER TABLE "ProductDocument" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "purchasedOn" TIMESTAMP(3),
ADD COLUMN     "referenceNumber" TEXT;

-- AlterTable
ALTER TABLE "FinanceCost" ADD COLUMN     "documentNumber" TEXT,
ADD COLUMN     "taxableAmount" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "FinanceRevenue" ADD COLUMN     "documentNumber" TEXT,
ADD COLUMN     "taxableAmount" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "allDay" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "campaignId" TEXT,
ADD COLUMN     "eventType" TEXT,
ADD COLUMN     "fieldGroupId" TEXT;

-- AlterTable
ALTER TABLE "DriveFile" ADD COLUMN     "inlineDataBase64" TEXT;

-- CreateTable
CREATE TABLE "OperationMaterialUsage" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "productMaterialId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationMaterialUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OperationMaterialUsage_operationId_idx" ON "OperationMaterialUsage"("operationId");

-- CreateIndex
CREATE INDEX "OperationMaterialUsage_productMaterialId_idx" ON "OperationMaterialUsage"("productMaterialId");

-- CreateIndex
CREATE INDEX "CalendarEvent_campaignId_idx" ON "CalendarEvent"("campaignId");

-- CreateIndex
CREATE INDEX "CalendarEvent_fieldGroupId_idx" ON "CalendarEvent"("fieldGroupId");

-- AddForeignKey
ALTER TABLE "OperationMaterialUsage" ADD CONSTRAINT "OperationMaterialUsage_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationMaterialUsage" ADD CONSTRAINT "OperationMaterialUsage_productMaterialId_fkey" FOREIGN KEY ("productMaterialId") REFERENCES "ProductMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_fieldGroupId_fkey" FOREIGN KEY ("fieldGroupId") REFERENCES "FieldGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

