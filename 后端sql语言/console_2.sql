-- ============================================================
-- 聊天会话/消息迁移脚本
-- 注意：请先执行 console.sql 和 console_1.sql，再执行本脚本
-- 完成旧 chat_logs 数据到 chat_sessions / chat_messages 的迁移
-- ============================================================
DROP TABLE IF EXISTS `chat_messages`;
DROP TABLE IF EXISTS `chat_sessions`;
DROP TABLE IF EXISTS `chat_logs`;
-- 3.6 聊天会话表（新）—— 直接包含 source_log_id 列
CREATE TABLE `chat_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `title` VARCHAR(255) DEFAULT NULL COMMENT '会话标题',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '软删除标记',
  `source_log_id` INT UNIQUE COMMENT '原chat_logs.id（用于迁移映射）',  -- 直接包含此列
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_deleted` (`user_id`, `is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天会话表';

-- 3.7 聊天消息表（新）
CREATE TABLE `chat_messages` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `session_id` INT NOT NULL COMMENT '所属会话ID',
  `role` VARCHAR(10) NOT NULL COMMENT '角色: user/assistant',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `intent` VARCHAR(50) DEFAULT NULL COMMENT '意图分类（仅助手）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session_created` (`session_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息表';

-- 3.8 旧的问答日志表（保留用于迁移）
CREATE TABLE `chat_logs` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `query` TEXT NOT NULL COMMENT '用户提问',
  `response` TEXT NOT NULL COMMENT '系统回答',
  `intent` VARCHAR(50) DEFAULT NULL COMMENT '意图分类',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='智能问答交互日志表（旧）';


-- 4.6 旧问答日志数据（用于迁移演示）
INSERT INTO `chat_logs` (`user_id`, `query`, `response`, `intent`, `created_at`) VALUES
(1, '今天四川水稻主要病害有哪些？', '四川水稻主要病害有纹枯病、稻瘟病、稻曲病。当前（7月）正值纹枯病高发期，建议加强田间水肥管理，适时用药防治。', '病虫害', NOW()),
(3, '我家水稻叶片上有梭形斑点，中间发白，边缘褐色，是什么病？', '根据您描述的症状，初步判断为稻瘟病（叶瘟型）。建议立即排水晒田，降低田间湿度，并喷施三环唑或稻瘟灵进行防治。', '病虫害诊断', NOW()),
(1, '什么是智慧农业？', '智慧农业是将物联网、大数据、人工智能等技术与传统农业相结合，实现精准感知、智能决策、高效管理的新型农业生产方式。', '知识科普', NOW()),
(2, '最近眉山地区柑橘园需注意什么？', '眉山地区当前（7月）高温多湿，需注意柑橘红蜘蛛和溃疡病的防治。同时注意抗旱，建议采用滴灌或穴灌保湿。', '农事建议', NOW());

-- ============================================================
-- 5. 迁移：将 chat_logs 迁移到 chat_sessions + chat_messages
-- ============================================================

-- 5.1 为 chat_sessions 增加 source_log_id 列（如果不存在）
SET @exist := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'chat_sessions'
      AND COLUMN_NAME = 'source_log_id'
);
SET @sql := IF(
    @exist = 0,
    'ALTER TABLE `chat_sessions` ADD COLUMN `source_log_id` INT UNIQUE COMMENT ''原chat_logs.id''',
    'SELECT ''source_log_id 已存在，跳过添加'' AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5.2 开启事务
START TRANSACTION;

-- 5.3 将每条 chat_log 转为独立会话
INSERT INTO `chat_sessions` (
    `user_id`,
    `title`,
    `source_log_id`,
    `is_deleted`,
    `created_at`,
    `updated_at`
)
SELECT
    IFNULL(`user_id`, 1) AS `user_id`,
    LEFT(`query`, 30) AS `title`,
    `id` AS `source_log_id`,
    0 AS `is_deleted`,
    `created_at`,
    `created_at` AS `updated_at`
FROM `chat_logs`
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);  -- 防止重复

-- 5.4 插入用户消息
INSERT INTO `chat_messages` (
    `session_id`,
    `role`,
    `content`,
    `intent`,
    `created_at`
)
SELECT
    s.`id`,
    'user',
    l.`query`,
    NULL,
    l.`created_at`
FROM `chat_logs` l
JOIN `chat_sessions` s ON s.`source_log_id` = l.`id`;

-- 5.5 插入助手消息
INSERT INTO `chat_messages` (
    `session_id`,
    `role`,
    `content`,
    `intent`,
    `created_at`
)
SELECT
    s.`id`,
    'assistant',
    l.`response`,
    l.`intent`,
    DATE_ADD(l.`created_at`, INTERVAL 1 MICROSECOND)
FROM `chat_logs` l
JOIN `chat_sessions` s ON s.`source_log_id` = l.`id`;

-- 5.6 数据校验（结果展示）
SELECT
    (SELECT COUNT(*) FROM `chat_sessions`) AS `sessions_count`,
    (SELECT COUNT(*) FROM `chat_logs`) AS `logs_count`,
    (SELECT COUNT(*) FROM `chat_messages`) AS `messages_count`,
    (SELECT COUNT(*) FROM `chat_logs`) * 2 AS `expected_messages`;

-- 5.7 提交
COMMIT;

-- ============================================================
-- 6. 可选：迁移完成后备份旧表（不要急着删除）
-- ============================================================
-- RENAME TABLE `chat_logs` TO `chat_logs_backup`;
-- 或直接 DROP（谨慎！）
-- DROP TABLE IF EXISTS `chat_logs`;

-- ============================================================
-- 7. 为演示新表功能，额外插入一些示例会话（可选）
-- ============================================================
-- 例如：为用户1创建两个多轮会话（不依赖迁移）
INSERT INTO `chat_sessions` (`user_id`, `title`, `is_deleted`) VALUES
(1, '水稻病虫害咨询', 0),
(1, '智慧农业讨论', 0);

INSERT INTO `chat_messages` (`session_id`, `role`, `content`, `intent`) VALUES
(LAST_INSERT_ID() - 1, 'user', '四川水稻主要病害有哪些？', NULL),
(LAST_INSERT_ID() - 1, 'assistant', '四川水稻主要病害有纹枯病、稻瘟病、稻曲病。当前正值纹枯病高发期，建议加强田间水肥管理，适时用药防治。', '病虫害'),
(LAST_INSERT_ID() - 1, 'user', '如何防治稻瘟病？', NULL),
(LAST_INSERT_ID() - 1, 'assistant', '稻瘟病可选用三环唑、稻瘟灵等药剂，发病初期喷施，间隔7-10天再喷一次。', '病虫害防治');

-- 第二个会话（注意：上一步LAST_INSERT_ID()已经变为最后一个插入的ID，这里重新获取）
SET @session2_id = (SELECT id FROM chat_sessions WHERE title = '智慧农业讨论' AND user_id = 1 LIMIT 1);
INSERT INTO `chat_messages` (`session_id`, `role`, `content`) VALUES
(@session2_id, 'user', '什么是智慧农业？'),
(@session2_id, 'assistant', '智慧农业是将物联网、大数据、人工智能等技术与传统农业相结合，实现精准感知、智能决策、高效管理的新型农业生产方式。');

-- 完成
SELECT '数据库初始化及迁移全部完成！' AS '状态';
