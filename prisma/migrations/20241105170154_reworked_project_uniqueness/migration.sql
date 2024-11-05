/*
  Warnings:

  - The primary key for the `IgnoredPath` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `ownerId` on the `IgnoredPath` table. All the data in the column will be lost.
  - The primary key for the `Project` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[ownerId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `IgnoredPath` DROP FOREIGN KEY `IgnoredPath_projectId_ownerId_fkey`;

-- AlterTable
ALTER TABLE `IgnoredPath` DROP PRIMARY KEY,
    DROP COLUMN `ownerId`,
    ADD PRIMARY KEY (`id`, `projectId`);

-- AlterTable
ALTER TABLE `Project` DROP PRIMARY KEY,
    ADD PRIMARY KEY (`id`);

-- CreateIndex
CREATE UNIQUE INDEX `Project_ownerId_key` ON `Project`(`ownerId`);

-- AddForeignKey
ALTER TABLE `IgnoredPath` ADD CONSTRAINT `IgnoredPath_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
