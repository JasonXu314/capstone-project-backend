-- DropForeignKey
ALTER TABLE `IgnoredPath` DROP FOREIGN KEY `IgnoredPath_projectId_fkey`;

-- AddForeignKey
ALTER TABLE `IgnoredPath` ADD CONSTRAINT `IgnoredPath_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
