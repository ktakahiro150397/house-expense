-- AlterTable
ALTER TABLE `receipt_items` ADD COLUMN `product_master_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `product_masters` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `product_masters_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_name_aliases` (
    `raw_name` VARCHAR(191) NOT NULL,
    `product_master_id` INTEGER NOT NULL,

    PRIMARY KEY (`raw_name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `receipt_items` ADD CONSTRAINT `receipt_items_product_master_id_fkey` FOREIGN KEY (`product_master_id`) REFERENCES `product_masters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_name_aliases` ADD CONSTRAINT `product_name_aliases_product_master_id_fkey` FOREIGN KEY (`product_master_id`) REFERENCES `product_masters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
