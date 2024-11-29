-- AlterTable
ALTER TABLE `TodoItem` ADD COLUMN `assigneeId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `TodoItem` ADD CONSTRAINT `TodoItem_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
