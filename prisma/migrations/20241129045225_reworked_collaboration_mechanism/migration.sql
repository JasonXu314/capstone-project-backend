/*
  Warnings:

  - You are about to drop the column `assigneeId` on the `TodoItem` table. All the data in the column will be lost.
  - You are about to alter the column `A` on the `_AccessTo` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - A unique constraint covering the columns `[id,github_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `TodoItem` DROP FOREIGN KEY `TodoItem_assigneeId_fkey`;

-- DropForeignKey
ALTER TABLE `_AccessTo` DROP FOREIGN KEY `_AccessTo_A_fkey`;

-- DropForeignKey
ALTER TABLE `_AccessTo` DROP FOREIGN KEY `_AccessTo_B_fkey`;

-- AlterTable
ALTER TABLE `TodoItem` DROP COLUMN `assigneeId`;

-- AlterTable
ALTER TABLE `_AccessTo` MODIFY `A` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `GHUserRef` (
    `id` INTEGER NOT NULL,
    `userId` VARCHAR(191) NULL,

    UNIQUE INDEX `GHUserRef_userId_id_key`(`userId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TodoAssignment` (
    `projectId` VARCHAR(191) NOT NULL,
    `todoId` VARCHAR(191) NOT NULL,
    `githubId` INTEGER NOT NULL,

    PRIMARY KEY (`projectId`, `todoId`, `githubId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `User_id_github_id_key` ON `User`(`id`, `github_id`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_id_github_id_fkey` FOREIGN KEY (`id`, `github_id`) REFERENCES `GHUserRef`(`userId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TodoAssignment` ADD CONSTRAINT `TodoAssignment_projectId_todoId_fkey` FOREIGN KEY (`projectId`, `todoId`) REFERENCES `TodoItem`(`projectId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TodoAssignment` ADD CONSTRAINT `TodoAssignment_githubId_fkey` FOREIGN KEY (`githubId`) REFERENCES `GHUserRef`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AccessTo` ADD CONSTRAINT `_AccessTo_A_fkey` FOREIGN KEY (`A`) REFERENCES `GHUserRef`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AccessTo` ADD CONSTRAINT `_AccessTo_B_fkey` FOREIGN KEY (`B`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
