-- Database: pdam_test
-- Schema untuk Technical Test Full Stack PT. Bimasakti Multi Sinergi

CREATE DATABASE IF NOT EXISTS `pdam_test` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pdam_test`;

-- --------------------------------------------------------
-- Table structure for table `transactions`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ref1` varchar(100) NOT NULL,
  `ref2` varchar(100) DEFAULT NULL,
  `product_code` varchar(20) NOT NULL,
  `product_name` varchar(100) NOT NULL,
  `customer_id` varchar(50) NOT NULL,
  `customer_name` varchar(150) DEFAULT NULL,
  `meter_number` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `nominal` decimal(15,2) DEFAULT 0.00,
  `admin` decimal(15,2) DEFAULT 0.00,
  `total_payment` decimal(15,2) DEFAULT 0.00,
  `inquiry_response` json DEFAULT NULL,
  `payment_response` json DEFAULT NULL,
  `status` enum('INQUIRY_SUCCESS','INQUIRY_FAILED','PAYMENT_SUCCESS','PAYMENT_FAILED') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_ref1` (`ref1`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_product_code` (`product_code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
