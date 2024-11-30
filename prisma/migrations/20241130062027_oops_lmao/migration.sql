-- DropForeignKey
ALTER TABLE `TodoAssignment` DROP FOREIGN KEY `TodoAssignment_projectId_todoId_fkey`;

-- AddForeignKey
ALTER TABLE `TodoAssignment` ADD CONSTRAINT `TodoAssignment_projectId_todoId_fkey` FOREIGN KEY (`projectId`, `todoId`) REFERENCES `TodoItem`(`projectId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;
