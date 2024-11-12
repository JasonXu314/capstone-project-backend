/*
  Warnings:

  - You are about to drop the column `typeId` on the `TodoItem` table. All the data in the column will be lost.
  - The primary key for the `TodoType` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TodoType` table. All the data in the column will be lost.
  - Added the required column `type` to the `TodoItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `TodoItem` DROP FOREIGN KEY `TodoItem_typeId_projectId_fkey`;

-- AlterTable
ALTER TABLE `TodoItem` DROP COLUMN `typeId`,
    ADD COLUMN `type` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `TodoType` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD PRIMARY KEY (`name`, `projectId`);

-- AddForeignKey
ALTER TABLE `TodoItem` ADD CONSTRAINT `TodoItem_type_projectId_fkey` FOREIGN KEY (`type`, `projectId`) REFERENCES `TodoType`(`name`, `projectId`) ON DELETE CASCADE ON UPDATE CASCADE;
