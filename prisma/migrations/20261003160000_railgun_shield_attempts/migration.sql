-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'REVIEW_REQUIRED';

-- AlterTable
ALTER TABLE "PaymentAttempt" ADD COLUMN     "blockNumber" INTEGER,
ADD COLUMN     "createdBlock" INTEGER,
ADD COLUMN     "encryptedBundle" JSONB,
ADD COLUMN     "grossAtomic" TEXT,
ADD COLUMN     "notePublicKey" TEXT,
ADD COLUMN     "shieldPublicKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_shieldPublicKey_key" ON "PaymentAttempt"("shieldPublicKey");

