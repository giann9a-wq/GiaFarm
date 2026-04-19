-- CreateEnum
CREATE TYPE "OutboundDdtKind" AS ENUM ('WAREHOUSE', 'FREE_TEXT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WarehouseMovementSource" ADD VALUE 'BOLLA_IN';
ALTER TYPE "WarehouseMovementSource" ADD VALUE 'LAVORAZIONE_OUT';
ALTER TYPE "WarehouseMovementSource" ADD VALUE 'DDT_OUT';
ALTER TYPE "WarehouseMovementSource" ADD VALUE 'RETTIFICA_ADMIN';
ALTER TYPE "WarehouseMovementSource" ADD VALUE 'ALTRO';

-- DropForeignKey
ALTER TABLE "OutboundDdtRow" DROP CONSTRAINT "OutboundDdtRow_productMaterialId_fkey";

-- AlterTable
ALTER TABLE "InboundDeliveryNote" ADD COLUMN     "internalRecipient" TEXT;

-- AlterTable
ALTER TABLE "InboundDeliveryRow" ADD COLUMN     "description" TEXT,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "OutboundDdt" ADD COLUMN     "destinationId" TEXT,
ADD COLUMN     "destinationText" TEXT,
ADD COLUMN     "driverSignature" TEXT,
ADD COLUMN     "kind" "OutboundDdtKind" NOT NULL DEFAULT 'WAREHOUSE',
ADD COLUMN     "packageAppearance" TEXT,
ADD COLUMN     "packageCount" TEXT,
ADD COLUMN     "recipientSignature" TEXT,
ADD COLUMN     "recipientSnapshot" JSONB,
ADD COLUMN     "senderHeading" TEXT,
ADD COLUMN     "sequenceNumber" INTEGER NOT NULL,
ADD COLUMN     "sequenceYear" INTEGER NOT NULL,
ADD COLUMN     "transportReason" TEXT,
ADD COLUMN     "transportStartsAt" TIMESTAMP(3),
ADD COLUMN     "transportedBy" TEXT,
ALTER COLUMN "status" SET DEFAULT 'ISSUED';

-- AlterTable
ALTER TABLE "OutboundDdtRow" ADD COLUMN     "lot" TEXT,
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "productMaterialId" DROP NOT NULL,
ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "WarehouseMovement" ADD COLUMN     "actorUserId" TEXT,
ADD COLUMN     "inboundDeliveryRowId" TEXT,
ADD COLUMN     "lot" TEXT,
ADD COLUMN     "outboundDdtRowId" TEXT;

-- CreateTable
CREATE TABLE "UnitOfMeasure" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitOfMeasure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DdtDestination" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DdtDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DdtNumberSequence" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "nextValue" INTEGER NOT NULL DEFAULT 1,
    "prefix" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DdtNumberSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseBalance" (
    "id" TEXT NOT NULL,
    "productMaterialId" TEXT NOT NULL,
    "lot" TEXT,
    "quantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UnitOfMeasure_code_key" ON "UnitOfMeasure"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DdtDestination_customerId_name_address_key" ON "DdtDestination"("customerId", "name", "address");

-- CreateIndex
CREATE UNIQUE INDEX "DdtNumberSequence_year_key" ON "DdtNumberSequence"("year");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseBalance_productMaterialId_lot_key" ON "WarehouseBalance"("productMaterialId", "lot");

-- CreateIndex
CREATE UNIQUE INDEX "InboundDeliveryNote_supplierId_number_issuedOn_key" ON "InboundDeliveryNote"("supplierId", "number", "issuedOn");

-- CreateIndex
CREATE UNIQUE INDEX "OutboundDdt_sequenceYear_sequenceNumber_key" ON "OutboundDdt"("sequenceYear", "sequenceNumber");

-- CreateIndex
CREATE INDEX "WarehouseMovement_source_sourceId_idx" ON "WarehouseMovement"("source", "sourceId");

-- AddForeignKey
ALTER TABLE "DdtDestination" ADD CONSTRAINT "DdtDestination_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundDdt" ADD CONSTRAINT "OutboundDdt_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "DdtDestination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundDdtRow" ADD CONSTRAINT "OutboundDdtRow_productMaterialId_fkey" FOREIGN KEY ("productMaterialId") REFERENCES "ProductMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseMovement" ADD CONSTRAINT "WarehouseMovement_inboundDeliveryRowId_fkey" FOREIGN KEY ("inboundDeliveryRowId") REFERENCES "InboundDeliveryRow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseMovement" ADD CONSTRAINT "WarehouseMovement_outboundDdtRowId_fkey" FOREIGN KEY ("outboundDdtRowId") REFERENCES "OutboundDdtRow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseMovement" ADD CONSTRAINT "WarehouseMovement_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseBalance" ADD CONSTRAINT "WarehouseBalance_productMaterialId_fkey" FOREIGN KEY ("productMaterialId") REFERENCES "ProductMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
