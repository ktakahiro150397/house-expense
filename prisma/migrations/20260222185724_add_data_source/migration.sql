-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `data_source_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `data_sources` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `institution` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_data_source_id_fkey` FOREIGN KEY (`data_source_id`) REFERENCES `data_sources`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
