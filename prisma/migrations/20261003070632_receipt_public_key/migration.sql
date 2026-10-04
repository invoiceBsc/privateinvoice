/*
  Warnings:

  - Added the required column `publicKey` to the `Receipt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "publicKey" TEXT NOT NULL,
ADD COLUMN     "signatureAlgorithm" TEXT NOT NULL DEFAULT 'Ed25519';
