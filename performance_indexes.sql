-- performance_indexes.sql
-- Run this script on your production database to improve performance.

ALTER TABLE `attendance` ADD INDEX `idx_attendance_date` (`date`);
ALTER TABLE `attendance` ADD INDEX `idx_attendance_status` (`status`);
ALTER TABLE `attendance` ADD INDEX `idx_attendance_user_date` (`user_id`, `date`);
ALTER TABLE `users` ADD INDEX `idx_users_role_status` (`role`, `status`);
