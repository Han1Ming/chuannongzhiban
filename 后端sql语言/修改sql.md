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

---

## 📅 2026-08-12 更新

### console.sql 新增聊天会话/消息表

当前后端实际使用 `chat_sessions` + `chat_messages` 两个新表，旧 `chat_logs` 仅保留用于兼容和迁移。`console.sql` 已补充：

- `chat_sessions`：聊天会话表
- `chat_messages`：聊天消息表
- 全新安装执行顺序：`console.sql` → `console_1.sql` → `console_2.sql`

### 知识图谱说明

知识图谱使用内置 `backend/knowledge_graph/seed_data.json` 演示数据，默认无需新增数据库表，也不需要安装 Neo4j。若配置了 `NEO4J_URI/NEO4J_USER/NEO4J_PASSWORD` 环境变量且 Neo4j 可用，后端会自动切换为 Neo4j 存储。

### 后端行为调整（同步更新 README）

- 智能问答流式/同步/WebSocket 增加离线兜底：模型额度或网络异常时返回知识图谱/RAG 结果和明确提示
- 新闻 `latest/list` 接口改为公开访问
- 管理端知识库分页接口修复（`KnowledgeItem` 无 `updated_at`，改为返回 `created_at`）

---

## 📅 AI 能力升级（五阶段改造）— 数据库变更

> ⚠ **重要：自本次改造起，数据库结构变更统一走迁移执行器，不再手工改 sql 文件。**

### 变更入口

```bash
cd backend
python -m migrations.run_migration status        # 查看版本状态
python -m migrations.run_migration up            # 应用迁移（幂等，可重复执行）
python -m migrations.run_migration up --dry-run  # 只看执行计划
python -m migrations.run_migration down 0002     # 回滚指定版本
python -m migrations.run_migration backup        # 导出全库结构快照
```

脚本与说明：`backend/migrations/`（详见该目录下的 `README.md`）。
每次 `up`/`down` 前会自动把涉及的表结构导出到 `backend/migrations/backup/<时间戳>_<动作>_<版本>/`。

### 新增版本

| 版本 | 表 | 变更 |
|:---:|---|---|
| `0001` | `chat_messages` | 新增 11 列：`prescription_json`、`reasoning_chain`、`sources`、`graph_paths`、`confidence_level`、`confidence`、`need_more_info`、`risk_warnings`、`agent_trace`、`source_meta`、`api_version`；新增索引 `idx_chat_messages_confidence_level` |
| `0002` | `agent_runs` | 新建多智能体链路审计表（intent / route / steps / elapsed_ms / degraded 等） |
| `0003` | `farm_records` | 新增 6 列：`prescription_json`、`reasoning_chain`、`sources`、`graph_paths`、`confidence_level`、`source_meta` |

### 兼容与回滚保证

- 所有新增列**可空或有默认值**，旧数据（`api_version` 默认 1）无需回填即可正常读取；
- 迁移执行器只做 `ADD COLUMN` / `CREATE TABLE`，**不做 DROP/TRUNCATE 既有业务表**；
- MySQL 9.x 不支持 `ADD COLUMN IF NOT EXISTS`，执行器改由 `information_schema` 预检实现幂等；
- 单版本内语句在同一事务中执行，任一句失败即整体回滚且不写入版本记录；
- 每个版本都配 `_down.sql`，结构与代码应成对回滚。

### 与旧 sql 文件的关系

`console.sql` / `console_1.sql` / `console_2.sql` **保持不变，继续作为全新安装的基线建库脚本**；
迁移执行器负责在既有库上做增量演进。全新部署时先跑基线脚本、再跑 `migrations up` 即可。

