-- AlterTable
ALTER TABLE "InboundDeliveryRow" ADD COLUMN     "articleCode" TEXT,
ADD COLUMN     "ciCode" TEXT,
ADD COLUMN     "lineAmount" DECIMAL(12,2),
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "unitPrice" DECIMAL(12,4);

