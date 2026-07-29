# 川农智伴 - 多模态AI农业智能体

## 项目简介

川农智伴是一个基于多模态AI的农业智能体系统，提供智能问答、知识管理、农业数据分析等功能。系统包含后端API服务和前端Web界面。

## 技术栈

### 后端

- **框架**: FastAPI 0.110+
- **数据库**: MySQL + Tortoise-ORM
- **AI模型**: 通义千问 (Qwen)
- **向量数据库**: ChromaDB
- **语言**: Python 3.12

### 前端

- **框架**: Vue 3 + Vite
- **UI组件**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **语言**: JavaScript/TypeScript

---

## 快速开始

### 前置要求

| 依赖    | 版本要求 | 说明               |
| ------- | -------- | ------------------ |
| Python  | 3.10+    | 推荐 3.12          |
| Node.js | 18.19.0  | **必须使用此版本** |
| MySQL   | 8.0+     | 数据库服务         |
| npm     | 8.x+     | 随 Node.js 安装    |

---

## 一、后端配置与运行

### 1. 环境准备

```bash
# 1. 进入后端目录
cd backend

# 2. 创建虚拟环境（推荐）
python -m venv venv

# 3. 激活虚拟环境
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Windows CMD
.\venv\Scripts\activate.bat

# macOS/Linux
source venv/bin/activate
```

### 2. 安装依赖

```bash
# 方式一：使用 requirements.txt 安装（推荐）
pip install -r requirements.txt

# 方式二：手动安装（如果 requirements.txt 安装失败）
pip install fastapi==0.110.0
pip install uvicorn[standard]==0.27.0
pip install tortoise-orm[asyncmy]==0.19.3
pip install pydantic==2.6.0
pip install python-jose[cryptography]==3.3.0
pip install python-multipart==0.0.9
pip install PyYAML==6.0
pip install aiofiles==23.2.1
pip install bcrypt==4.1.2
pip install chromadb==0.4.22
pip install langchain==0.1.13
pip install langchain-community==0.0.30
pip install langgraph==0.0.52
pip install python-dotenv==1.0.0
pip install openpyxl==3.1.2
pip install python-docx==1.1.0
```

### 3. 数据库配置

#### 3.1 创建数据库

```sql
-- 登录 MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE chuanban_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 3.2 修改配置文件

编辑 `backend/config/db.yml` 文件：

```yaml
# MySQL 数据库配置文件
db_type: mysql
host: localhost # 数据库地址
port: 3306 # 数据库端口
user: root # 数据库用户名
password: "123" # 数据库密码（修改为你的密码）
database: chuanban_db # 数据库名
charset: utf8mb4
pool_size: 5
max_overflow: 10
```

#### 3.3 AI模型配置

编辑 `backend/config/rag.yml` 文件：

```yaml
chat_model_name: qwen-plus-2025-07-28 # 对话模型名称
embedding_model_name: text-embedding-v4 # 嵌入模型名称
api_key: "你的API_KEY" # 阿里云API密钥
```

> **注意**: 需要在阿里云DashScope平台申请API密钥。

### 4. 启动后端服务

```bash
# 方式一：直接运行（开发模式）
python main.py

# 方式二：使用 uvicorn 启动
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

启动成功后访问：`http://localhost:8000`

### 5. 接口文档

启动后自动生成 Swagger 文档：

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### 6. API接口说明

#### 6.1 智能客服接口（ApiFox调用）

| 接口           | 方法 | 说明                               |
| -------------- | ---- | ---------------------------------- |
| `/chat`        | POST | 非流式智能问答，等待完整回复后返回 |
| `/chat/stream` | POST | 流式智能问答，实时返回回复内容     |

**请求示例**（ApiFox）：

```json
POST http://localhost:8000/chat
Content-Type: application/json

{
    "query": "扫地机器人如何保养"
}
```

**响应示例**：

```json
{
  "response": "根据知识库内容，扫地机器人保养建议如下：..."
}
```

#### 6.2 其他接口

| 模块     | 路径前缀         | 说明                 |
| -------- | ---------------- | -------------------- |
| 用户管理 | `/api/user`      | 注册、登录、个人信息 |
| 聊天管理 | `/api/chat`      | 会话管理、消息记录   |
| 知识库   | `/api/knowledge` | 知识文档管理         |
| 农业数据 | `/api/farm`      | 农业记录、数据分析   |
| 管理员   | `/api/admin`     | 用户管理、系统配置   |
| 新闻资讯 | `/api/news`      | 新闻列表、详情       |
| 验证码   | `/api/captcha`   | 获取验证码           |

### 7. 后端项目结构

```
backend/
├── core/               # 核心模块
│   ├── config.py       # 配置加载
│   └── database.py     # 数据库连接
├── routers/            # API路由
│   ├── chat.py         # 聊天接口
│   ├── user.py         # 用户接口
│   ├── knowledge.py    # 知识库接口
│   ├── farm.py         # 农业数据接口
│   ├── admin.py        # 管理员接口
│   └── ...
├── models/             # 数据库模型
├── services/           # 业务逻辑
├── schemas/            # 数据校验
├── rag/                # RAG检索
├── app_agent/          # 智能客服Agent（ApiFox调用入口）
│   ├── api.py          # FastAPI接口文件
│   ├── agent/          # Agent实现
│   ├── config/         # Agent配置
│   └── ...
├── config/             # 配置文件
├── data/               # 数据文件
├── logs/               # 日志文件
├── requirements.txt    # Python依赖
└── main.py             # 入口文件
```

---

## 二、前端配置与运行

### 1. 环境准备

**必须使用 Node.js 18.19.0 版本**

```bash
# 推荐使用 nvm-windows 管理 Node 版本
# 安装 nvm-windows 后：
nvm install 18.19.0
nvm use 18.19.0

# 验证版本
node -v   # 应显示 v18.19.0
npm -v    # 应显示 8.x
```

### 2. 安装依赖

```bash
# 进入前端目录
cd vue-frontend

# 安装依赖
npm install
```

### 3. API代理配置

前端已配置自动代理，无需手动设置环境变量。`vite.config.js` 配置如下：

```javascript
server: {
  port: 5173,
  proxy: {
    "/api": { target: "http://localhost:8000", changeOrigin: true },
    "/chat": { target: "http://localhost:8000", changeOrigin: true },
  },
}
```

前端请求 `/api/*` 和 `/chat/*` 会自动转发到后端 `http://localhost:8000`。

### 4. 启动开发服务器

```bash
npm run dev
```

启动成功后访问：`http://localhost:5173`

### 5. 构建生产版本

```bash
npm run build
```

构建产物位于 `dist/` 目录。

### 6. 前端项目结构

```
vue-frontend/
├── src/
│   ├── components/     # 公共组件
│   ├── views/          # 页面视图
│   │   ├── LoginView.vue    # 登录页
│   │   ├── ChatView.vue     # 聊天页
│   │   ├── Dashboard.vue    # 仪表盘
│   │   └── ...
│   ├── router/         # 路由配置
│   ├── stores/         # Pinia状态管理
│   ├── utils/          # 工具函数
│   ├── api/            # API接口封装
│   └── main.js         # 入口文件
├── public/             # 静态资源
├── index.html          # HTML模板
├── vite.config.js      # Vite配置（含API代理）
└── package.json        # 项目配置
```

---

## 三、常见问题

### 1. Node.js 版本问题

**问题**: 使用 Node.js 20+ 版本启动前端时出现兼容性错误

**解决方案**:

```bash
# 使用 nvm 切换到 18.19.0
nvm install 18.19.0
nvm use 18.19.0
```

### 2. MySQL 连接失败

**检查项**:

- MySQL 服务是否已启动
- 端口 `3306` 是否被占用
- 用户名和密码是否正确
- 数据库 `chuanban_db` 是否已创建

### 3. PowerShell 执行策略问题

**问题**: Windows PowerShell 执行脚本时提示"禁止运行脚本"

**解决方案**:

```powershell
# 查看当前执行策略
Get-ExecutionPolicy

# 修改执行策略（以管理员身份运行）
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 4. 前端跨域问题

前端已配置 Vite 代理，请求会自动转发到后端。如果仍有跨域问题，请检查：

- 后端服务是否正常运行
- 后端 CORS 配置是否正确

### 5. ApiFox 调用接口失败

**检查项**:

- 后端服务是否正常启动
- 请求地址是否正确（`http://localhost:8000/chat`）
- 请求格式是否正确（JSON格式，包含 `query` 字段）

---

## 四、配置文件说明

### 后端配置文件

| 文件                 | 说明                |
| -------------------- | ------------------- |
| `config/db.yml`      | MySQL数据库连接配置 |
| `config/rag.yml`     | AI模型和API密钥配置 |
| `config/prompts.yml` | 提示词文件路径配置  |
| `config/chroma.yml`  | 向量数据库配置      |

### 前端配置

前端使用 Vite 代理，无需 `.env` 文件。代理配置位于 `vite.config.js` 的 `server.proxy` 部分。

---

## 五、开发建议

1. **后端开发**: 推荐使用 PyCharm 或 VS Code，配合 FastAPI 的自动重载功能
2. **前端开发**: 使用 VS Code，安装 Vue 官方插件
3. **API测试**: 使用 ApiFox 或 Postman 测试接口
4. **日志**: 后端日志位于 `logs/` 目录，可用于排查问题

