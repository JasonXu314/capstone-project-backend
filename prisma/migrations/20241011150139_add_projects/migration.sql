-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IgnoredPath` (
    `id` INTEGER NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `IgnoredPath_id_projectId_key`(`id`, `projectId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `IgnoredPath` ADD CONSTRAINT `IgnoredPath_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
