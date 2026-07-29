# SQL 文件修改记录

> 修改日期：2026-07-17
> 修改依据：审查报告中的问题 1~5，对照后端 ORM 模型修正

---

## 📄 console.sql

### 修复 1 — 误删 chat_logs 表（L74）

**问题**：`chat_logs` 表创建后（L61-72）立即被 `DROP TABLE IF EXISTS chat_logs;` 删除，导致后续的 INSERT 因表不存在而失败。

**修改**：
```sql
-- 修改前
DROP TABLE IF EXISTS `chat_logs`;

-- 修改后（注释掉）
-- DROP TABLE IF EXISTS `chat_logs`;
```

---

### 修复 2 — 重复插入 farm_records（L145-148）

**问题**：`farm_records` 表有两段完全相同的 INSERT 语句，会插入重复数据。

**修改**：删除第二段重复的 INSERT（原 L145-148 整块）。

---

### 修复 3 — chat_logs.user_id 约束与 ORM 模型一致

**问题**：SQL 建表时 `user_id` 为 `INT DEFAULT NULL`，但 ORM 模型（`chat_log.py`）中定义为 `null=False`（不允许空值），且演示数据中有一条 `(NULL, '什么是智慧农业？', ...)`。

**修改**：
```sql
-- 修改前
`user_id` INT DEFAULT NULL COMMENT '用户ID（可为空，未登录用户）',

-- 修改后
`user_id` INT NOT NULL COMMENT '用户ID',
```

同时将演示数据中的 `NULL` 改为有效用户 ID `1`：
```sql
-- 修改前
(NULL, '什么是智慧农业？', ...)

-- 修改后
(1, '什么是智慧农业？', ...)
```

---

### 修复 4 — recommendations 字段长度匹配 ORM 模型

**问题**：SQL 建表的 VARCHAR 长度小于 ORM 模型（`recommendation.py`）定义的 `max_length`，可能存在数据截断风险。

| 字段 | 修改前 | 修改后 | 模型 max_length |
|------|:------:|:------:|:---------------:|
| `region` | VARCHAR(50) | VARCHAR(100) | 100 |
| `farming_type` | VARCHAR(20) | VARCHAR(50) | 50 |
| `crop_name` | VARCHAR(50) | VARCHAR(100) | 100 |

---

## 📄 console_1.sql

### 修复 5 — 表名统一为 agricultural_news

**问题**：CREATE TABLE 建表名为 `news`，但 ORM 模型（`news.py`）中定义的表名为 `agricultural_news`，且同一文件中的 INSERT 也使用了 `agricultural_news`，导致建表与插入不一致。

**修改**：
```sql
-- 修改前
CREATE TABLE IF NOT EXISTS `news` (

-- 修改后
CREATE TABLE IF NOT EXISTS `agricultural_news` (
```

（INSERT 语句中的 `agricultural_news` 保持不变，现在与 CREATE TABLE 一致。）

---

## 📄 console_2.sql

### 修复 6 — chat_logs.user_id 约束与 ORM 模型一致

**问题**：与 console.sql 相同，`user_id` 为 `INT DEFAULT NULL`，但 ORM 模型要求 NOT NULL，且演示数据中有 `NULL` 值。

**修改**：
```sql
-- 修改前
`user_id` INT DEFAULT NULL COMMENT '用户ID',

-- 修改后
`user_id` INT NOT NULL COMMENT '用户ID',
```

同时将演示数据中的 `NULL` 改为 `1`：
```sql
-- 修改前
(NULL, '什么是智慧农业？', ...)

-- 修改后
(1, '什么是智慧农业？', ...)
```

---

## 未修改

| 问题 | 说明 |
|:----|------|
| 问题 6（chat_sessions.source_log_id） | 该字段仅用于迁移映射，ORM 未定义但不会导致错误，按指示保留 |
