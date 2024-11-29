/*
  Warnings:

  - The primary key for the `TodoAssignment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `githubId` on the `TodoAssignment` table. All the data in the column will be lost.
  - Added the required column `userId` to the `TodoAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `TodoAssignment` DROP FOREIGN KEY `TodoAssignment_githubId_fkey`;

-- AlterTable
ALTER TABLE `TodoAssignment` DROP PRIMARY KEY,
    DROP COLUMN `githubId`,
    ADD COLUMN `userId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`projectId`, `todoId`, `userId`);

-- AddForeignKey
ALTER TABLE `TodoAssignment` ADD CONSTRAINT `TodoAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
