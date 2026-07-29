-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `chuanban_db`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `chuanban_db`;

-- =============================================
-- 1. 用户表 (对应 models/user.py)
-- =============================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `phone` VARCHAR(20) UNIQUE DEFAULT NULL COMMENT '手机号（唯一）',
  `wechat_openid` VARCHAR(64) DEFAULT NULL COMMENT '微信OpenID',
  `username` VARCHAR(50) DEFAULT NULL COMMENT '用户名/昵称',
  `password_hash` VARCHAR(128) NOT NULL COMMENT '密码哈希 (BCrypt)',
  `role` VARCHAR(20) NOT NULL DEFAULT 'USER' COMMENT '角色: USER/ADMIN/GOV',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户表';

-- =============================================
-- 2. 知识库表 (对应 models/knowledge.py)
-- =============================================
DROP TABLE IF EXISTS `knowledge_items`;
CREATE TABLE `knowledge_items` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '知识ID',
  `title` VARCHAR(200) NOT NULL COMMENT '标题',
  `category` VARCHAR(50) NOT NULL COMMENT '分类: rice/citrus/tea/livestock',
  `content` TEXT NOT NULL COMMENT '知识内容（富文本/Markdown）',
  `tags` VARCHAR(200) DEFAULT NULL COMMENT '标签，逗号分隔',
  `source` VARCHAR(100) DEFAULT NULL COMMENT '来源（如：四川农科院）',
  `is_vectorized` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已向量化 (0否/1是)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='农业知识库表';

-- =============================================
-- 3. 农事诊断记录表 (对应 models/farm_record.py)
-- =============================================
DROP TABLE IF EXISTS `farm_records`;
CREATE TABLE `farm_records` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `crop_type` VARCHAR(50) NOT NULL COMMENT '作物类型（水稻/柑橘/茶叶/畜禽）',
  `image_url` VARCHAR(255) DEFAULT NULL COMMENT '图片存储地址（OSS/MinIO）',
  `diagnosis_result` TEXT DEFAULT NULL COMMENT 'AI诊断结果（病虫害名称+置信度）',
  `advice` TEXT DEFAULT NULL COMMENT '农事建议（防治方案）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_crop_type` (`crop_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='病虫害诊断与农事建议记录表';

-- =============================================
-- 4. 问答日志表 (对应 models/chat_log.py)
-- =============================================
DROP TABLE IF EXISTS `chat_logs`;
CREATE TABLE `chat_logs` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `query` TEXT NOT NULL COMMENT '用户提问内容',
  `response` TEXT NOT NULL COMMENT '系统回答内容',
  `intent` VARCHAR(50) DEFAULT NULL COMMENT '意图分类（如：病虫害/农事/政策）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='智能问答交互日志表';

-- DROP TABLE IF EXISTS `chat_logs`;
CREATE TABLE `recommendations` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `region` VARCHAR(100) NOT NULL COMMENT '地区，如：四川',
  `farming_type` VARCHAR(50) NOT NULL COMMENT '农作类型：种植/养殖',
  `season` VARCHAR(20) NOT NULL COMMENT '季节：春季/夏季/全年等',
  `crop_name` VARCHAR(100) NOT NULL COMMENT '作物或养殖品种名称',
  `plan` TEXT NOT NULL COMMENT '推荐方案详情',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_region` (`region`),
  KEY `idx_farming_type` (`farming_type`),
  KEY `idx_season` (`season`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='农业推荐方案表';

-- 删除已存在的表（谨慎使用）
-- ----------------------------
-- 公告表
-- ----------------------------
DROP TABLE IF EXISTS `announcements`;
CREATE TABLE `announcements`(
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '公告ID',
  `title` VARCHAR(200) NOT NULL COMMENT '公告标题',
  `content` TEXT NOT NULL COMMENT '公告内容',
  `category` VARCHAR(20) NOT NULL DEFAULT 'notice' COMMENT '公告类别：notice-通知，warning-预警',
  `target_role` VARCHAR(20) DEFAULT NULL COMMENT '目标角色：USER-农户，ADMIN-管理员，GOV-政府，NULL表示全部',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用：1-启用，0-停用',
  `read_count` INT NOT NULL DEFAULT 0 COMMENT '阅读次数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_target_role` (`target_role`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统公告表';

-- 插入管理员 (role=ADMIN)
INSERT INTO `users` (`phone`, `username`, `password_hash`, `role`) VALUES
('13800000001', '系统管理员', '$2b$12$2Kp.xcPAfHkrHELActFFA.E8cdo6MacGgYYcTDhcMP3gVtE4tFdL.', 'ADMIN');

-- 插入政府监管人员 (role=GOV)
INSERT INTO `users` (`phone`, `username`, `password_hash`, `role`) VALUES
('13800000002', '农业局王主任', '$2b$12$2Kp.xcPAfHkrHELActFFA.E8cdo6MacGgYYcTDhcMP3gVtE4tFdL.', 'GOV');

-- 插入普通农户 (role=USER)
INSERT INTO `users` (`phone`, `username`, `password_hash`, `role`) VALUES
('13900000001', '水稻种植户老张', '$2b$12$2Kp.xcPAfHkrHELActFFA.E8cdo6MacGgYYcTDhcMP3gVtE4tFdL.', 'USER'),
('13900000002', '柑橘园李姐', '$2b$12$2Kp.xcPAfHkrHELActFFA.E8cdo6MacGgYYcTDhcMP3gVtE4tFdL.', 'USER');


-- 柑橘类知识
INSERT INTO `knowledge_items` (`title`, `category`, `content`, `tags`, `source`) VALUES
('柑橘红蜘蛛综合防治', 'citrus', '柑橘红蜘蛛（全爪螨）是四川柑橘主要害虫。\n防治要点：\n1. 生物防治：释放捕食螨（如巴氏钝绥螨）。\n2. 化学防治：春季萌芽前喷石硫合剂，生长期用螺螨酯或乙螨唑。\n3. 注意轮换用药，避免抗性。', '柑橘,红蜘蛛,四川,害虫', '四川柑橘研究所'),
('晚熟柑橘冬季防冻措施', 'citrus', '四川晚熟柑橘（如春见、不知火）冬季需防冻：\n1. 冻前灌水，增加土壤热容量。\n2. 树冠覆盖无纺布或遮阳网。\n3. 树干涂白（生石灰+石硫合剂）。', '柑橘,防冻,四川,晚熟', '四川柑橘研究所');
-- 茶叶类知识
INSERT INTO `knowledge_items` (`title`, `category`, `content`, `tags`, `source`)
VALUES ('四川茶树主要害虫防治', 'tea', '四川茶区主要害虫：茶小绿叶蝉、茶毛虫。\n防治方案：\n1. 农业防治：及时采摘，修剪病虫枝。\n2. 物理防治：使用LED诱虫灯。\n3. 化学防治：茶小绿叶蝉用茚虫威，茶毛虫用苏云金杆菌（Bt）。', '茶树,四川,害虫,茶叶', '四川茶叶研究所');
INSERT INTO `knowledge_items` (`title`, `category`, `content`, `tags`, `source`)
VALUES ('名优绿茶采摘标准', 'tea', '四川名优绿茶（如蒙顶甘露）采摘标准：\n1. 时间：清明前（明前茶）或谷雨前（雨前茶）。\n2. 标准：单芽或一芽一叶初展。\n3. 要求：无叶柄、无鱼叶、无碎叶。', '绿茶,采摘,四川,名茶', '四川茶叶研究所');
-- 畜禽类知识
INSERT INTO `knowledge_items` (`title`, `category`, `content`, `tags`, `source`) VALUES
('四川生猪常见疫病防控', 'livestock', '四川生猪常见疫病：非洲猪瘟、蓝耳病、猪瘟。\n防控要点：\n1. 生物安全：严禁泔水饲喂，进出消毒。\n2. 疫苗免疫：猪瘟苗、蓝耳苗按程序免疫。\n3. 监测：发现异常立即隔离并报告当地兽医站。', '生猪,四川,疫病,防疫', '四川省动物疫控中心'),
('山地散养土鸡饲养管理', 'livestock', '四川山地散养土鸡管理要点：\n1. 密度：每亩不超过50只。\n2. 补饲：早晚补充玉米、豆粕，保证营养。\n3. 防天敌：设置防护网，防治鹰、蛇、野狗。', '土鸡,散养,四川,管理', '四川省动物疫控中心');

-- 农场记录
INSERT INTO `farm_records` (`user_id`, `crop_type`, `diagnosis_result`, `advice`) VALUES
(3, '水稻', '{"disease": "稻瘟病（叶瘟型）", "confidence": 0.92}', '建议立即使用三环唑可湿性粉剂喷雾，间隔7天再次喷施，同时追施硅钾肥增强抗性。'),
(4, '柑橘', '{"disease": "红蜘蛛", "confidence": 0.88}', '建议使用螺螨酯悬浮剂3000倍液喷雾，重点喷施叶背，注意轮换用药。');


INSERT INTO `chat_logs` (`user_id`, `query`, `response`, `intent`) VALUES
(1, '今天四川水稻主要病害有哪些？', '四川水稻主要病害有纹枯病、稻瘟病、稻曲病。当前（7月）正值纹枯病高发期，建议加强田间水肥管理，适时用药防治。', '病虫害'),
(3, '我家水稻叶片上有梭形斑点，中间发白，边缘褐色，是什么病？', '根据您描述的症状，初步判断为稻瘟病（叶瘟型）。建议立即排水晒田，降低田间湿度，并喷施三环唑或稻瘟灵进行防治。', '病虫害诊断'),
(1, '什么是智慧农业？', '智慧农业是将物联网、大数据、人工智能等技术与传统农业相结合，实现精准感知、智能决策、高效管理的新型农业生产方式。', '知识科普'),
(2, '最近眉山地区柑橘园需注意什么？', '眉山地区当前（7月）高温多湿，需注意柑橘红蜘蛛和溃疡病的防治。同时注意抗旱，建议采用滴灌或穴灌保湿。', '农事建议');

INSERT INTO recommendations (region, farming_type, season, crop_name, plan) VALUES
('四川', '种植', '春季', '水稻', '推荐种植早稻，品种宜选川优系列，注意防倒春寒。'),
('四川', '种植', '夏季', '玉米', '夏季高温多雨，推荐耐涝品种，注意防治玉米螟。'),
('四川', '养殖', '全年', '生猪', '建议采用发酵床养殖，注意防疫。');


-- ----------------------------
-- 初始化公告数据
-- ----------------------------
INSERT INTO `announcements` (`title`, `content`, `category`, `target_role`, `is_active`, `read_count`) VALUES
('春季病虫害预警', '近期气温回升，请农户注意防治稻飞虱、纹枯病等病虫害，及时开展田间巡查。', 'warning', 'USER', 1, 0),
('台风预警', '预计明后天有强台风登陆，请提前加固大棚、疏通排水沟，做好防灾准备。', 'warning', 'USER', 1, 0),
('系统维护通知', '平台将于本周末（7月10日）凌晨2:00-5:00进行系统升级维护，届时服务可能短暂中断，敬请谅解。', 'notice', NULL, 1, 0);
