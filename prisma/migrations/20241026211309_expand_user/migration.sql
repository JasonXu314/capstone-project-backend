/*
  Warnings:

  - A unique constraint covering the columns `[installation_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[github_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[token]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `github_id` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `installation_id` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `github_id` INTEGER NOT NULL,
    ADD COLUMN `installation_id` INTEGER NOT NULL,
    ADD COLUMN `token` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_installation_id_key` ON `User`(`installation_id`);

-- CreateIndex
CREATE UNIQUE INDEX `User_github_id_key` ON `User`(`github_id`);

-- CreateIndex
CREATE UNIQUE INDEX `User_token_key` ON `User`(`token`);
