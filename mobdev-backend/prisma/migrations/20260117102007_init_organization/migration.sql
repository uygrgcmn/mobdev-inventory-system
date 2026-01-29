/*
  Warnings:

  - You are about to drop the column `ownerUserId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `ownerUserId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `ownerUserId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `ownerUserId` on the `StockTransaction` table. All the data in the column will be lost.
  - The `userId` column on the `StockTransaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `ownerUserId` on the `Supplier` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,organizationId]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sku,type,message,resolved,organizationId]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sku,organizationId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,organizationId]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `StockTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Category" DROP CONSTRAINT "Category_ownerUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_ownerUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_ownerUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StockTransaction" DROP CONSTRAINT "StockTransaction_ownerUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Supplier" DROP CONSTRAINT "Supplier_ownerUserId_fkey";

-- DropIndex
DROP INDEX "public"."Category_name_ownerUserId_key";

-- DropIndex
DROP INDEX "public"."Category_ownerUserId_idx";

-- DropIndex
DROP INDEX "public"."Notification_sku_type_message_resolved_ownerUserId_key";

-- DropIndex
DROP INDEX "public"."Product_sku_ownerUserId_key";

-- DropIndex
DROP INDEX "public"."Supplier_name_ownerUserId_key";

-- DropIndex
DROP INDEX "public"."Supplier_ownerUserId_idx";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "ownerUserId",
ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "ownerUserId",
ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "ownerUserId",
ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "StockTransaction" DROP COLUMN "ownerUserId",
ADD COLUMN     "organizationId" INTEGER NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "ownerUserId",
ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Category_organizationId_idx" ON "Category"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_organizationId_key" ON "Category"("name", "organizationId");

-- CreateIndex
CREATE INDEX "Notification_organizationId_idx" ON "Notification"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_sku_type_message_resolved_organizationId_key" ON "Notification"("sku", "type", "message", "resolved", "organizationId");

-- CreateIndex
CREATE INDEX "Product_organizationId_idx" ON "Product"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_organizationId_key" ON "Product"("sku", "organizationId");

-- CreateIndex
CREATE INDEX "StockTransaction_organizationId_idx" ON "StockTransaction"("organizationId");

-- CreateIndex
CREATE INDEX "StockTransaction_userId_idx" ON "StockTransaction"("userId");

-- CreateIndex
CREATE INDEX "Supplier_organizationId_idx" ON "Supplier"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_organizationId_key" ON "Supplier"("name", "organizationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
