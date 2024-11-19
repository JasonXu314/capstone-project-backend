/*
  Warnings:

  - Added the required column `completed` to the `TodoItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `TodoItem` ADD COLUMN `completed` BOOLEAN NOT NULL;
