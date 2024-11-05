/*
  Warnings:

  - The primary key for the `Project` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `ownerId` to the `IgnoredPath` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `IgnoredPath` DROP FOREIGN KEY `IgnoredPath_projectId_fkey`;

-- DropIndex
DROP INDEX `IgnoredPath_id_projectId_key` ON `IgnoredPath`;

-- AlterTable
ALTER TABLE `IgnoredPath` ADD COLUMN `ownerId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`, `projectId`, `ownerId`);

-- AlterTable
ALTER TABLE `Project` DROP PRIMARY KEY,
    ADD COLUMN `ownerId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`, `ownerId`);

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IgnoredPath` ADD CONSTRAINT `IgnoredPath_projectId_ownerId_fkey` FOREIGN KEY (`projectId`, `ownerId`) REFERENCES `Project`(`id`, `ownerId`) ON DELETE CASCADE ON UPDATE CASCADE;
