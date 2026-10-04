-- AlterTable
ALTER TABLE "PaymentAttempt" ADD COLUMN     "balanceState" TEXT NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "MockWithdrawal" (
    "id" UUID NOT NULL,
    "merchantId" UUID NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "amountAtomic" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MockWithdrawal_txHash_key" ON "MockWithdrawal"("txHash");

-- AddForeignKey
ALTER TABLE "MockWithdrawal" ADD CONSTRAINT "MockWithdrawal_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
