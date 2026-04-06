CREATE DATABASE IF NOT EXISTS `onesta_db`;
USE `onesta_db`;
SET FOREIGN_KEY_CHECKS = 0;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: onesta_db
-- ------------------------------------------------------
-- Server version	8.0.45
--
-- Table structure for table `admins`
--
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('super_admin','admin') DEFAULT 'admin',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at?` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `admins`
--
LOCK TABLES `admins` WRITE;
INSERT INTO `admins` VALUES (7,'Super Admin','admin@kronik-781.com','$2a$10$gMIIslZaHL81bALf2zz4eeGy0LN6ged1RzE8OySNAo1084cEZxUAC','super_admin',NULL,'2026-04-03 20:41:13','2026-04-03 20:41:13','2026-04-03 20:41:13');
UNLOCK TABLES;
--
-- Table structure for table `announcements`
--
DROP TABLE IF EXISTS `announcements`;
CREATE TABLE `announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_ann_user` (`admin_id`),
  CONSTRAINT `fk_ann_user` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `announcements`
--
LOCK TABLES `announcements` WRITE;
INSERT INTO `announcements` VALUES (1,1,'Monthly Meeting','Tomorrow is monthly meeting kindly attend this meeting in time.','2026-03-31 18:22:41','2026-03-31 18:22:41'),(2,1,'Nothern Tour ','This message is for all employees that company wants to give all respected employees a tour to beautiful northern areas as you all know every year company plan this tour so that kindly submit all employees their availability for this tour because company gives this tour to all of you as a reward of efforts you all made the whole year.\nPlease submit your availability on time ','2026-03-31 18:26:43','2026-03-31 18:26:43'),(3,1,'No Leave ','No leave will be issued to any employee regarding this week because of work load.','2026-03-31 18:28:27','2026-03-31 18:28:27');
UNLOCK TABLES;
--
-- Table structure for table `asset_assignments`
--
DROP TABLE IF EXISTS `asset_assignments`;
CREATE TABLE `asset_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asset_id` int NOT NULL,
  `user_id` int NOT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `returned_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_aa_asset` (`asset_id`),
  KEY `fk_aa_user` (`user_id`),
  CONSTRAINT `fk_aa_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_aa_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `asset_assignments`
--
LOCK TABLES `asset_assignments` WRITE;
UNLOCK TABLES;
--
-- Table structure for table `assets`
--
DROP TABLE IF EXISTS `assets`;
CREATE TABLE `assets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` varchar(100) DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `status` enum('available','assigned','maintenance','retired') DEFAULT 'available',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `assets`
--
LOCK TABLES `assets` WRITE;
UNLOCK TABLES;
--
-- Table structure for table `attendance`
--
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `leave_application_id` int DEFAULT NULL,
  `date` date NOT NULL,
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `check_in_location` varchar(255) DEFAULT NULL,
  `check_out_location` varchar(255) DEFAULT NULL,
  `check_in_latitude` decimal(10,8) DEFAULT NULL,
  `check_in_longitude` decimal(11,8) DEFAULT NULL,
  `check_out_latitude` decimal(10,8) DEFAULT NULL,
  `check_out_longitude` decimal(11,8) DEFAULT NULL,
  `hours_worked` varchar(10) DEFAULT NULL,
  `status` enum('checked_in','completed','absent','leave') DEFAULT 'checked_in',
  `shift_id` int DEFAULT NULL,
  `is_leave_day` tinyint(1) DEFAULT '0',
  `leave_type` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `extra_hours` varchar(10) DEFAULT '00:00',
  `is_late` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_att_leave` (`leave_application_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_att_leave` FOREIGN KEY (`leave_application_id`) REFERENCES `leave_applications` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_att_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `attendance`
--
LOCK TABLES `attendance` WRITE;
INSERT INTO `attendance` VALUES (1,1,NULL,'2026-03-31','22:47:22','07:47:22','31.45627968629715, 73.16303999999998','31.45627968629715, 73.16303999999998',31.45627969,73.16304000,31.45627969,73.16304000,'09:00','completed',NULL,0,NULL,'2026-03-31 17:47:22','2026-04-01 14:00:00','00:00',0),(2,4,NULL,'2026-03-31','23:10:58','08:10:58','31.45628881666198, 73.16303999999998','31.45628881666198, 73.16303999999998',31.45628882,73.16304000,31.45628882,73.16304000,'09:00','completed',NULL,0,NULL,'2026-03-31 18:10:58','2026-04-01 14:00:00','00:00',0),(3,3,NULL,'2026-03-31','23:11:37','08:11:37','31.47, 73.2','31.47, 73.2',31.47000000,73.20000000,31.47000000,73.20000000,'09:00','completed',NULL,0,NULL,'2026-03-31 18:11:37','2026-04-01 14:00:00','00:00',0),(4,5,NULL,'2026-03-31','23:12:09','08:12:09','31.45628881666198, 73.16303999999998','31.45628881666198, 73.16303999999998',31.45628882,73.16304000,31.45628882,73.16304000,'09:00','completed',NULL,0,NULL,'2026-03-31 18:12:09','2026-04-01 14:00:00','00:00',0),(5,6,NULL,'2026-03-31','23:12:33','08:12:33','31.45628881666198, 73.16303999999998','31.45628881666198, 73.16303999999998',31.45628882,73.16304000,31.45628882,73.16304000,'09:00','completed',NULL,0,NULL,'2026-03-31 18:12:33','2026-04-01 14:00:00','00:00',0),(6,7,NULL,'2026-03-31','23:13:13','08:13:13','31.456288287249116, 73.16303944132231','31.456288287249116, 73.16303944132231',31.45628829,73.16303944,31.45628829,73.16303944,'09:00','completed',NULL,0,NULL,'2026-03-31 18:13:13','2026-04-01 14:00:00','00:00',0),(7,8,NULL,'2026-03-31','23:13:38','08:13:38','31.456288287249116, 73.16303944132231','31.456288287249116, 73.16303944132231',31.45628829,73.16303944,31.45628829,73.16303944,'09:00','completed',NULL,0,NULL,'2026-03-31 18:13:38','2026-04-01 14:00:00','00:00',0),(8,6,4,'2026-06-21',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-03-31 18:53:45','2026-03-31 18:53:45','00:00',0),(9,6,4,'2026-06-22',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-03-31 18:53:45','2026-03-31 18:53:45','00:00',0),(10,6,4,'2026-06-23',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-03-31 18:53:45','2026-03-31 18:53:45','00:00',0),(11,6,4,'2026-06-24',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-03-31 18:53:45','2026-03-31 18:53:45','00:00',0),(12,6,4,'2026-06-25',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-03-31 18:53:45','2026-03-31 18:53:45','00:00',0),(13,6,4,'2026-06-26',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-03-31 18:53:45','2026-03-31 18:53:45','00:00',0),(14,6,4,'2026-06-27',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-03-31 18:53:45','2026-03-31 18:53:45','00:00',0),(15,7,1,'2026-05-24',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-03-31 18:53:51','2026-03-31 18:53:51','00:00',0),(16,7,1,'2026-05-25',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-03-31 18:53:51','2026-03-31 18:53:51','00:00',0),(17,7,1,'2026-05-26',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-03-31 18:53:51','2026-03-31 18:53:51','00:00',0),(18,7,1,'2026-05-27',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-03-31 18:53:51','2026-03-31 18:53:51','00:00',0),(19,7,1,'2026-05-28',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-03-31 18:53:51','2026-03-31 18:53:51','00:00',0),(20,7,1,'2026-05-29',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-03-31 18:53:51','2026-03-31 18:53:51','00:00',0),(21,7,1,'2026-05-30',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-03-31 18:53:51','2026-03-31 18:53:51','00:00',0),(22,7,NULL,'2026-04-01','00:39:13','09:39:13','31.47, 73.2','31.47, 73.2',31.47000000,73.20000000,31.47000000,73.20000000,'09:00','completed',NULL,0,NULL,'2026-03-31 19:39:13','2026-04-01 14:00:00','00:00',0),(23,8,NULL,'2026-04-01','00:41:42','09:41:42','31.45628881666198, 73.16303999999998','31.45628881666198, 73.16303999999998',31.45628882,73.16304000,31.45628882,73.16304000,'09:00','completed',NULL,0,NULL,'2026-03-31 19:41:42','2026-04-01 14:00:00','00:00',0),(24,1,NULL,'2026-04-01','19:50:13','04:50:13','31.45628881666198, 73.16304075976396','31.45628881666198, 73.16304075976396',31.45628882,73.16304076,31.45628882,73.16304076,'09:00','completed',NULL,0,NULL,'2026-04-01 14:50:13','2026-04-02 10:00:00','00:00',0),(25,4,NULL,'2026-04-01','19:54:15','04:54:15','31.45627968629715, 73.16303999999998','31.45627968629715, 73.16303999999998',31.45627969,73.16304000,31.45627969,73.16304000,'09:00','completed',NULL,0,NULL,'2026-04-01 14:54:15','2026-04-02 10:00:00','00:00',0),(26,3,NULL,'2026-04-01','19:55:59','04:55:59','31.45628881666198, 73.16303999999998','31.45628881666198, 73.16303999999998',31.45628882,73.16304000,31.45628882,73.16304000,'09:00','completed',NULL,0,NULL,'2026-04-01 14:55:59','2026-04-02 10:00:00','00:00',0),(27,11,NULL,'2026-04-01','20:53:36','05:53:36','31.45628881666198, 73.16303999999998','31.45628881666198, 73.16303999999998',31.45628882,73.16304000,31.45628882,73.16304000,'09:00','completed',NULL,0,NULL,'2026-04-01 15:53:36','2026-04-02 10:00:00','00:00',1),(28,1,NULL,'2026-04-02','01:27:20','10:27:20',NULL,NULL,NULL,NULL,NULL,NULL,'09:00','completed',NULL,0,NULL,'2026-04-01 20:27:20','2026-04-02 10:00:00','00:00',0),(29,7,NULL,'2026-04-02','01:33:10','10:33:10','31.45628881666198, 73.16304075976396','31.45628881666198, 73.16304075976396',31.45628882,73.16304076,31.45628882,73.16304076,'09:00','completed',2,0,NULL,'2026-04-01 20:33:10','2026-04-02 10:00:00','00:00',0),(30,7,5,'2026-04-05',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-04-01 20:44:41','2026-04-01 20:44:41','00:00',0),(31,7,5,'2026-04-06',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-04-01 20:44:41','2026-04-01 20:44:41','00:00',0),(32,7,5,'2026-04-07',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-04-01 20:44:41','2026-04-01 20:44:41','00:00',0),(33,7,5,'2026-04-08',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-04-01 20:44:41','2026-04-01 20:44:41','00:00',0),(34,7,NULL,'2026-04-02','20:45:00','20:53:17','31.456281073526686, 73.16303917647072','31.45629075, 73.16304',31.45628107,73.16303918,31.45629075,73.16304000,'NaN:NaN','completed',2,0,NULL,'2026-04-02 15:45:00','2026-04-02 15:53:17','00:00',1),(35,7,NULL,'2026-04-02','00:19:02','09:19:02','31.45628881666198, 73.16304075976396','31.45628881666198, 73.16304075976396',31.45628882,73.16304076,31.45628882,73.16304076,'09:00','completed',2,0,NULL,'2026-04-02 19:19:02','2026-04-02 19:30:00','00:00',1),(36,7,NULL,'2026-04-03','19:09:57','04:09:57','31.45628881666198, 73.16304075976396','31.45628881666198, 73.16304075976396',31.45628882,73.16304076,31.45628882,73.16304076,'09:00','completed',2,0,NULL,'2026-04-03 14:09:57','2026-04-04 15:00:00','00:00',0),(37,1,NULL,'2026-04-03','19:37:52','04:37:52','31.45628881666198, 73.16304075976396','31.45628881666198, 73.16304075976396',31.45628882,73.16304076,31.45628882,73.16304076,'09:00','completed',1,0,NULL,'2026-04-03 14:37:52','2026-04-04 15:00:00','00:00',1),(38,3,NULL,'2026-04-03','23:44:48','08:44:48','31.45628881666198, 73.16304075976396','31.45628881666198, 73.16304075976396',31.45628882,73.16304076,31.45628882,73.16304076,'09:00','completed',2,0,NULL,'2026-04-03 18:44:48','2026-04-04 15:00:00','00:00',1),(39,1,6,'2026-04-16',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'SL','2026-04-03 20:06:29','2026-04-03 20:06:29','00:00',0),(40,1,6,'2026-04-17',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'SL','2026-04-03 20:06:29','2026-04-03 20:06:29','00:00',0),(41,1,6,'2026-04-18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'SL','2026-04-03 20:06:29','2026-04-03 20:06:29','00:00',0),(42,1,6,'2026-04-19',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'SL','2026-04-03 20:06:29','2026-04-03 20:06:29','00:00',0),(43,1,6,'2026-04-20',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'SL','2026-04-03 20:06:29','2026-04-03 20:06:29','00:00',0),(44,5,3,'2026-05-24',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-04-03 21:11:54','2026-04-03 21:11:54','00:00',0),(45,5,3,'2026-05-25',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-04-03 21:11:54','2026-04-03 21:11:54','00:00',0),(46,5,3,'2026-05-26',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-04-03 21:11:54','2026-04-03 21:11:54','00:00',0),(47,5,3,'2026-05-27',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-04-03 21:11:54','2026-04-03 21:11:54','00:00',0),(48,5,3,'2026-05-28',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-04-03 21:11:54','2026-04-03 21:11:54','00:00',0),(49,5,3,'2026-05-29',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-04-03 21:11:54','2026-04-03 21:11:54','00:00',0),(50,5,3,'2026-05-30',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'leave',NULL,1,'CL','2026-04-03 21:11:54','2026-04-03 21:11:54','00:00',0);
UNLOCK TABLES;
--
-- Table structure for table `audit_logs`
--
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `admin_id` int DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `old_data` json DEFAULT NULL,
  `new_data` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `audit_logs`
--
LOCK TABLES `audit_logs` WRITE;
INSERT INTO `audit_logs` VALUES (1,NULL,6,'GET /api/admin/dashboard','/api/admin',NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-31 17:44:28'),(2,NULL,6,'GET /api/admin/dashboard','/api/admin',NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-31 17:44:28'),(3,NULL,6,'GET /api/admin/users?page=1&limit=10&search=&role_type=hr','/api/admin',NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-31 17:44:36'),(4,NULL,6,'GET /api/admin/users?page=1&limit=10&search=&role_type=hr','/api/admin',NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-31 17:44:36'),(5,NULL,6,'POST /api/admin/hr','/api/admin',NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-31 17:45:38'),(6,NULL,6,'GET /api/admin/users?page=1&limit=10&search=&role_type=','/api/admin',NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-31 17:45:38'),(7,NULL,6,'GET /api/admin/users?page=1&limit=10&search=&role_type=','/api/admin',NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-31 17:45:38'),(8,NULL,6,'GET /api/admin/dashboard','/api/admin',NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-31 20:37:10'),(9,NULL,6,'GET /api/admin/dashboard','/api/admin',NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-31 20:37:10'),(10,NULL,6,'GET /api/admin/dashboard','/api/admin',NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-03 20:29:31'),(11,NULL,6,'GET /api/admin/dashboard','/api/admin',NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-03 20:29:31'),(12,NULL,6,'GET /api/admin/admins','/api/admin',NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-03 20:29:38'),(13,NULL,6,'GET /api/admin/admins','/api/admin',NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-03 20:29:38'),(14,NULL,6,'DELETE /api/admin/admins/5','/api/admin',NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-03 20:29:53'),(15,NULL,6,'GET /api/admin/admins','/api/admin',NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-03 20:29:53'),(16,NULL,6,'DELETE /api/admin/admins/4','/api/admin',NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-03 20:29:56'),(17,NULL,6,'GET /api/admin/admins','/api/admin',NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-03 20:29:56');
UNLOCK TABLES;
--
-- Table structure for table `break_requests`
--
DROP TABLE IF EXISTS `break_requests`;
CREATE TABLE `break_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `manager_id` int DEFAULT NULL,
  `date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `duration_hours` float DEFAULT NULL,
  `reason` text,
  `status` enum('pending','approved','rejected','cancelled') DEFAULT 'pending',
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `manager_id` (`manager_id`),
  CONSTRAINT `break_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`),
  CONSTRAINT `break_requests_ibfk_2` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `break_requests`
--
LOCK TABLES `break_requests` WRITE;
INSERT INTO `break_requests` VALUES (1,7,3,'2026-04-03',NULL,NULL,2,'I have to for some work outside if you please give me breaktime. ','approved','2026-04-03 18:35:27');
UNLOCK TABLES;
--
-- Table structure for table `cancellation_requests`
--
DROP TABLE IF EXISTS `cancellation_requests`;
CREATE TABLE `cancellation_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leave_application_id` int NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_cancel_la` (`leave_application_id`),
  CONSTRAINT `fk_cancel_la` FOREIGN KEY (`leave_application_id`) REFERENCES `leave_applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `cancellation_requests`
--
LOCK TABLES `cancellation_requests` WRITE;
UNLOCK TABLES;
--
-- Table structure for table `employee_leave_balances`
--
DROP TABLE IF EXISTS `employee_leave_balances`;
CREATE TABLE `employee_leave_balances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `leave_type_id` int NOT NULL,
  `total_allocated` decimal(5,2) NOT NULL,
  `used` decimal(5,2) DEFAULT '0.00',
  `pending` decimal(5,2) DEFAULT '0.00',
  `year` int NOT NULL,
  `created_by_hr_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_emp_leave_year` (`employee_id`,`leave_type_id`,`year`),
  KEY `fk_lb_type` (`leave_type_id`),
  CONSTRAINT `fk_lb_type` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lb_user` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `employee_leave_balances`
--
LOCK TABLES `employee_leave_balances` WRITE;
INSERT INTO `employee_leave_balances` VALUES (1,5,1,8.00,0.00,0.00,2026,1),(2,5,2,10.00,2.00,0.00,2026,1),(3,5,3,12.00,0.00,0.00,2026,1),(4,6,1,8.00,0.00,0.00,2026,1),(5,6,2,10.00,4.00,0.00,2026,1),(6,6,3,12.00,0.00,0.00,2026,1),(7,7,1,8.00,0.00,0.00,2026,1),(8,7,2,10.00,5.00,0.00,2026,1),(9,7,3,12.00,0.00,0.00,2026,1),(10,8,1,8.00,0.00,0.00,2026,1),(11,8,2,10.00,0.00,0.00,2026,1),(12,8,3,12.00,0.00,0.00,2026,1),(13,11,1,10.00,0.00,0.00,2026,1),(14,11,2,12.00,0.00,0.00,2026,1),(15,11,3,15.00,0.00,0.00,2026,1),(16,1,1,9.00,3.00,0.00,2026,1),(17,1,2,12.00,0.00,0.00,2026,1),(18,1,3,15.00,0.00,0.00,2026,1);
UNLOCK TABLES;
--
-- Table structure for table `kpis`
--
DROP TABLE IF EXISTS `kpis`;
CREATE TABLE `kpis` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `target` varchar(255) DEFAULT NULL,
  `weight` int DEFAULT '0',
  `progress` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_kpi_user` (`user_id`),
  CONSTRAINT `fk_kpi_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `kpis`
--
LOCK TABLES `kpis` WRITE;
UNLOCK TABLES;
--
-- Table structure for table `leave_application_details`
--
DROP TABLE IF EXISTS `leave_application_details`;
CREATE TABLE `leave_application_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `leave_type_id` int NOT NULL,
  `days_applied` decimal(5,2) NOT NULL,
  `balance_status` enum('hold','deducted') DEFAULT 'hold',
  PRIMARY KEY (`id`),
  KEY `fk_lad_app` (`application_id`),
  KEY `fk_lad_type` (`leave_type_id`),
  CONSTRAINT `fk_lad_app` FOREIGN KEY (`application_id`) REFERENCES `leave_applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lad_type` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `leave_application_details`
--
LOCK TABLES `leave_application_details` WRITE;
INSERT INTO `leave_application_details` VALUES (1,1,2,2.00,'hold'),(2,2,2,3.00,'hold'),(3,3,2,2.00,'hold'),(4,4,2,4.00,'hold'),(5,5,2,3.00,'hold'),(6,6,1,3.00,'hold');
UNLOCK TABLES;
--
-- Table structure for table `leave_applications`
--
DROP TABLE IF EXISTS `leave_applications`;
CREATE TABLE `leave_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `manager_id` int DEFAULT NULL,
  `application_no` varchar(50) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days` decimal(5,2) NOT NULL,
  `reason` text,
  `status` enum('pending_manager','pending_gm','approved_by_manager','pending_hr','pending_ceo','approved','rejected_by_manager','rejected','cancelled') DEFAULT 'pending_manager',
  `current_approver` enum('manager','hr','ceo') DEFAULT 'manager',
  `manager_comments` text,
  `hr_comments` text,
  `ceo_comments` text,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `app_no_UNIQUE` (`application_no`),
  KEY `fk_la_user` (`employee_id`),
  KEY `fk_la_manager` (`manager_id`),
  CONSTRAINT `fk_la_manager` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_la_user` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `leave_applications`
--
LOCK TABLES `leave_applications` WRITE;
INSERT INTO `leave_applications` VALUES (1,7,3,'LEAVE-2026-0001','2026-05-24','2026-05-30',2.00,'I want to apply for casual leave of 2 days which is necessary for me because i want to travel back home for Eid al-Adha eve.','approved',NULL,'','',NULL,'2026-03-31 18:34:14'),(2,8,4,'LEAVE-2026-0002','2026-06-23','2026-06-27',3.00,'I want casual leave for 3 days i want to go home as i have 2 days ashura holidays but i want to avail my 3 days casual leave to enjoy some time with my family.','rejected_by_manager',NULL,'I\'m rejecting your leave because you have already avail 2 days casual leave this month ',NULL,NULL,'2026-03-31 18:36:44'),(3,5,3,'LEAVE-2026-0003','2026-05-24','2026-05-30',2.00,'I want to apply for 2 days casual leave as i want to go for Eid al-Adha so that i want 2 extra leave.','approved',NULL,NULL,'',NULL,'2026-03-31 18:38:45'),(4,6,4,'LEAVE-2026-0004','2026-06-21','2026-06-27',4.00,'I want to go home as i have 2 holidays of ashura so i want to apply for 4 casual leaves so that i can enjoy some time with my family.','approved',NULL,'','',NULL,'2026-03-31 18:40:53'),(5,7,3,'LEAVE-2026-0005','2026-04-05','2026-04-08',3.00,'I want casual leave because i have to go to my home for visiting my family ','approved',NULL,'','',NULL,'2026-04-01 20:35:58'),(6,1,NULL,'LEAVE-2026-0006','2026-04-16','2026-04-20',3.00,'I\'m sick so i want sick leave that\'s it.','approved',NULL,NULL,NULL,'','2026-04-03 19:45:06');
UNLOCK TABLES;
--
-- Table structure for table `leave_types`
--
DROP TABLE IF EXISTS `leave_types`;
CREATE TABLE `leave_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(10) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code_UNIQUE` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `leave_types`
--
LOCK TABLES `leave_types` WRITE;
INSERT INTO `leave_types` VALUES (1,'Sick Leave','SL',1,'2026-03-31 17:16:42'),(2,'Casual Leave','CL',1,'2026-03-31 17:16:42'),(3,'Annual Leave','AL',1,'2026-03-31 17:16:42');
UNLOCK TABLES;
--
-- Table structure for table `notifications`
--
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `from_user_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `link` varchar(255) DEFAULT NULL,
  `type` varchar(50) DEFAULT 'portal',
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_notif_user` (`user_id`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `notifications`
--
LOCK TABLES `notifications` WRITE;
INSERT INTO `notifications` VALUES (1,3,NULL,'New Leave Application','Abdullah Niazi has applied for 2 days leave.',NULL,'portal',0,'2026-03-31 18:34:14'),(2,4,NULL,'New Leave Application','Hassan Khan  has applied for 3 days leave.',NULL,'portal',0,'2026-03-31 18:36:44'),(3,3,NULL,'New Leave Application','Azeem Niazi has applied for 2 days leave.',NULL,'portal',0,'2026-03-31 18:38:45'),(4,4,NULL,'New Leave Application','Shaheer Khan has applied for 4 days leave.',NULL,'portal',0,'2026-03-31 18:40:53'),(5,1,3,'Leave Update','Manager approved LEAVE-2026-0001 (Abdullah Niazi). Final review needed.','/leave-approvals','portal',0,'2026-03-31 18:41:34'),(6,1,4,'Leave Update','Manager approved LEAVE-2026-0004 (Shaheer Khan). Final review needed.','/leave-approvals','portal',0,'2026-03-31 18:48:32'),(7,8,4,'Leave Update','Request LEAVE-2026-0002 was rejected by manager.',NULL,'portal',0,'2026-03-31 18:52:33'),(8,6,1,'Leave Update','Congratulations! Your leave LEAVE-2026-0004 is approved.',NULL,'portal',0,'2026-03-31 18:53:45'),(9,7,1,'Leave Update','Congratulations! Your leave LEAVE-2026-0001 is approved.',NULL,'portal',0,'2026-03-31 18:53:51'),(10,3,7,'New Leave Request','Abdullah Niazi has applied for 3 days leave.','/leave-approvals','portal',0,'2026-04-01 20:35:58'),(11,1,3,'Leave Update','Manager approved LEAVE-2026-0005 (Abdullah Niazi). Final review needed.','/leave-approvals','portal',0,'2026-04-01 20:42:41'),(12,7,3,'Leave Manager Approved','Your leave request LEAVE-2026-0005 has been approved by manager and sent to HR.',NULL,'portal',0,'2026-04-01 20:42:48'),(13,7,1,'Leave Final Approval','Congratulations! Your leave LEAVE-2026-0005 has been officially approved by HR.',NULL,'portal',0,'2026-04-01 20:44:41'),(14,3,7,'New Break Request','Abdullah Niazi has applied for a 2h break on 2026-04-03.','/leave-approvals','portal',0,'2026-04-03 18:35:27'),(15,7,3,'Break Request Approved Ô£à','Your break request for Fri Apr 03 2026 00:00:00 GMT+0500 (Pakistan Standard Time) (2h) has been approved.',NULL,'portal',0,'2026-04-03 18:35:58'),(16,9,1,'New Leave Request (ACM/GM/HR)','Bilal Niazi (hr) has applied for 3 days leave. Requires CEO approval.','/leave-approvals','portal',0,'2026-04-03 19:45:06'),(17,1,9,'Leave CEO Approved','Your leave request LEAVE-2026-0006 has been approved by CEO.',NULL,'portal',0,'2026-04-03 20:06:29'),(18,5,1,'Leave Final Approval','Congratulations! Your leave LEAVE-2026-0003 has been officially approved by HR.',NULL,'portal',0,'2026-04-03 21:11:54');
UNLOCK TABLES;
--
-- Table structure for table `performance_reviews`
--
DROP TABLE IF EXISTS `performance_reviews`;
CREATE TABLE `performance_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `reviewer_id` int NOT NULL,
  `period` varchar(100) NOT NULL,
  `score` decimal(3,2) DEFAULT NULL,
  `comments` text,
  `status` enum('pending','submitted','reviewed') DEFAULT 'pending',
  `created_at?` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pr_user` (`user_id`),
  KEY `fk_pr_reviewer` (`reviewer_id`),
  CONSTRAINT `fk_pr_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `performance_reviews`
--
LOCK TABLES `performance_reviews` WRITE;
UNLOCK TABLES;
--
-- Table structure for table `public_holidays`
--
DROP TABLE IF EXISTS `public_holidays`;
CREATE TABLE `public_holidays` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `holiday_date` date NOT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_holiday_user` (`created_by`),
  CONSTRAINT `fk_holiday_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `public_holidays`
--
LOCK TABLES `public_holidays` WRITE;
INSERT INTO `public_holidays` VALUES (1,'Kashmir Day ','2026-02-05',1,'2026-03-31 18:14:46'),(2,'Eid al-Fitr ','2026-03-21',1,'2026-03-31 18:15:10'),(3,'Eid al-fitr ','2026-03-22',1,'2026-03-31 18:15:26'),(4,'Eid al-Fitr','2026-03-20',1,'2026-03-31 18:15:50'),(5,'Pakistan Day ','2026-03-23',1,'2026-03-31 18:16:14'),(6,'Labour Day ','2026-05-01',1,'2026-03-31 18:16:35'),(7,'Eid al-Adha ','2026-05-26',1,'2026-03-31 18:16:59'),(8,'Eid al-Adha ','2026-05-27',1,'2026-03-31 18:17:19'),(9,'Eid al-Adha ','2026-05-28',1,'2026-03-31 18:17:44'),(10,'Ashura 1','2026-07-25',1,'2026-03-31 18:18:22'),(11,'Ashura 2','2026-06-26',1,'2026-03-31 18:18:40'),(12,'Independance Day','2026-08-14',1,'2026-03-31 18:19:11'),(13,'Defense Day ','2026-09-06',1,'2026-03-31 18:19:39'),(14,'Iqbal Day ','2026-11-09',1,'2026-03-31 18:21:06'),(15,'Quaid-e-Azam Day','2026-12-25',1,'2026-03-31 18:21:31');
UNLOCK TABLES;
--
-- Table structure for table `settings`
--
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key_UNIQUE` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `settings`
--
LOCK TABLES `settings` WRITE;
INSERT INTO `settings` VALUES (1,'weekly_holidays','[\"Sunday\",\"Saturday\"]','2026-04-03 19:02:48');
UNLOCK TABLES;
--
-- Table structure for table `shifts`
--
DROP TABLE IF EXISTS `shifts`;
CREATE TABLE `shifts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_night_shift` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `shifts`
--
LOCK TABLES `shifts` WRITE;
INSERT INTO `shifts` VALUES (1,'Morning Shift','09:00:00','18:00:00',0,'2026-03-31 19:42:01'),(2,'Night Shift','20:00:00','05:00:00',1,'2026-03-31 19:42:01');
UNLOCK TABLES;
--
-- Table structure for table `tickets`
--
DROP TABLE IF EXISTS `tickets`;
CREATE TABLE `tickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `category` enum('IT','HR','Admin') NOT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` enum('open','in_progress','resolved','closed') DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_ticket_user` (`user_id`),
  CONSTRAINT `fk_ticket_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `tickets`
--
LOCK TABLES `tickets` WRITE;
UNLOCK TABLES;
--
-- Table structure for table `user_documents`
--
DROP TABLE IF EXISTS `user_documents`;
CREATE TABLE `user_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_type` varchar(50) DEFAULT 'other',
  `file_size` int DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_doc_user` (`user_id`),
  CONSTRAINT `fk_doc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `user_documents`
--
LOCK TABLES `user_documents` WRITE;
UNLOCK TABLES;
--
-- Table structure for table `users`
--
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `manager_id` int DEFAULT NULL,
  `reporting_to` varchar(255) DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `cnic` varchar(15) DEFAULT NULL,
  `address` text,
  `profile_url` varchar(255) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `role_type` enum('employee','manager','hr','ceo') DEFAULT 'employee',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  `shift_id` int DEFAULT '1',
  `shift_type` enum('morning','night') DEFAULT 'morning',
  `rank_weight` int DEFAULT '7',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`),
  UNIQUE KEY `employee_id_UNIQUE` (`employee_id`),
  KEY `idx_manager` (`manager_id`),
  KEY `fk_user_shift` (`shift_id`),
  CONSTRAINT `fk_user_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_users_manager` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Dumping data for table `users`
--
LOCK TABLES `users` WRITE;
INSERT INTO `users` VALUES (1,NULL,'Bilal Niazi','bilalkhanniazi765@gmail.com','$2a$10$gvF1rgZAqqksT6xe.uPI3.GOdjt04tmxWvIywLDrbLrJsYt8U/NcO','HR ','Human Resouce',NULL,NULL,NULL,'03215464895','3830238753077',NULL,NULL,NULL,'user','hr','active','2026-03-31 17:45:35','2026-04-03 21:13:42','2026-04-03 21:13:42',1,'morning',2);
INSERT INTO `users` VALUES (3,NULL,'Umais Khan','bilalniazi781@gmail.com','$2a$10$5sAM9vaFy.ncvveTfAYn8.aggQJGDtrj6spJFJFl.W7JeBO4LxAX2','Manager','Web Dev',NULL,NULL,NULL,'03326854493','3830238753065',NULL,NULL,NULL,'user','manager','active','2026-03-31 17:53:57','2026-04-03 18:44:42','2026-04-03 18:44:42',2,'morning',7);
INSERT INTO `users` VALUES (4,NULL,'Azhar Niazi','niazi7589@gmail.com','$2a$10$rqgDdyjH4/WXnS2P5IEtyOkakgVJPHSUkIF0Wljh0E9Dw12o1WdW6','Manager','Mobile Dev ',NULL,NULL,NULL,'03384967310','3830238753074',NULL,NULL,NULL,'user','manager','active','2026-03-31 17:55:25','2026-04-02 13:21:44','2026-04-02 13:21:44',2,'morning',7);
INSERT INTO `users` VALUES (5,NULL,'Azeem Niazi','azeemniazi89@gmail.com','$2a$10$KPSDIxtAN.oE6RXujlSI0uLry2qJ86SJfcj7lP/0Rnk3EOQbemlIG','Developer','Web Dev',3,'Umais Khan',NULL,'03368904554','3830238753068',NULL,NULL,NULL,'user','employee','active','2026-03-31 17:57:19','2026-04-01 20:00:59','2026-03-31 18:37:03',2,'morning',7);
INSERT INTO `users` VALUES (6,NULL,'Shaheer Khan','shaheerkhan07@gmail.com','$2a$10$KSqBDZlz73Kz4OLrcYo5cOLMLSMc/aFWG.FDmqsAgUq8qQ98ascW2','Developer','Mobile Dev ',4,'Azhar Niazi',NULL,'03226789024','3830238753074',NULL,NULL,NULL,'user','employee','active','2026-03-31 17:58:55','2026-04-02 13:20:59','2026-03-31 18:39:14',2,'morning',7);
INSERT INTO `users` VALUES (7,NULL,'Abdullah Niazi','flameeye007@gmail.com','$2a$10$UWB8QadTP6n0zxtSNRz3O.2bfn02qrZvL3eLDxWzqp0N5WJb1nMfm','Developer','Web Dev',3,'Umais Khan',NULL,'03266824792','3830233553074',NULL,NULL,NULL,'user','employee','active','2026-03-31 18:01:53','2026-04-03 18:38:22','2026-04-03 18:38:22',2,'morning',7);
INSERT INTO `users` VALUES (8,NULL,'Hassan Khan ','bilalniazi804@gmail.com','$2a$10$U7aZ07taxGtJWyZR2S87V.KX91jtZ4bpVmgZQqKO5tFpiCoA/JXXK','Developer','Mobile Dev ',4,'Azhar Niazi',NULL,'03342377834','3830278953074',NULL,NULL,NULL,'user','employee','active','2026-03-31 18:03:24','2026-04-02 13:21:03','2026-04-01 18:26:38',2,'morning',7);
INSERT INTO `users` VALUES (9,NULL,'Ahmed Khan','zarwishniazi786@gmail.com','$2a$10$NkPLpaAMVw.zQjvWR6zsl.Jr1TPrIA6bKpn2p86wkDsbYsDyBA2GO','CEO','Management',NULL,NULL,NULL,'03215464895','3830238753069',NULL,NULL,NULL,'user','ceo','active','2026-03-31 18:10:06','2026-04-03 21:13:18','2026-04-03 21:13:18',2,'morning',1);
INSERT INTO `users` VALUES (11,NULL,'Meer Hadi','meerhadi@gmail.com','$2a$10$iKWODTKKrc4AZPXD.7AWd.tIB58Z9UDylZbV5rZBumQmMhZQqVQKS','Developer','Mobile Dev ',4,'Azhar Niazi',NULL,'03396782901','5678938753789',NULL,NULL,NULL,'user','employee','active','2026-04-01 15:52:54','2026-04-02 13:21:11','2026-04-01 15:53:25',2,'morning',7);
UNLOCK TABLES;
-- Dump completed on 2026-04-05 21:46:27
SET FOREIGN_KEY_CHECKS = 1;