/*
  Warnings:

  - Added the required column `avatar` to the `GHUserRef` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `GHUserRef` ADD COLUMN `avatar` VARCHAR(191) NOT NULL;
