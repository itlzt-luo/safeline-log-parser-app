# 日志解析器 📊

一个功能强大的日志解析和可视化工具，可以帮助您快速分析服务器访问日志。

## 功能特点 ✨

- 📁 支持上传日志文件（.txt, .log 格式）
- 📄 可加载项目中的默认 log.txt 文件
- 🗂️ 支持指定服务器文件路径加载
- 📊 实时数据统计和可视化
- 🔍 强大的日志搜索和过滤功能
  - 全文搜索（路径、IP、方法、域名）
  - 状态码过滤（2xx、3xx、4xx、5xx）
  - 请求方法过滤（GET、POST、PUT、DELETE 等）
  - 域名过滤
  - IP 地址过滤
  - 日期范围筛选
- ⚡ **快速筛选功能**（新功能）
  - 表格中直接点击域名、IP、方法、状态码快速筛选
  - 详情页也支持点击筛选
  - 智能关联分析，无需手动操作筛选器
  - 悬停提示，一键应用筛选条件
- � **智能时间选择**（新功能）
  - 6个快捷日期按钮（今天、昨天、最近7天、最近30天、本月、上月）
  - 优化的日期选择器界面，渐变背景设计
  - 一键选择常用时间范围，省去繁琐的日期选择
- �📈 多维度排序
  - 时间排序（升序/降序）
  - 大小排序（升序/降序）
  - 状态码排序（升序/降序）
- ⏰ 友好的时间格式显示（"刚刚"、"5分钟前"、"昨天 14:30"）
- 📈 多种图表展示（饼图、柱状图）
- 📋 详细的日志列表查看
- 📱 响应式设计，支持移动端

## 支持的日志格式

```
IP | user | timestamp | "domain" | "request" | status | size | "referer" | "user-agent" "client-ip"
```

示例：
```
127.0.0.1 | - | 04/Mar/2026:09:53:59 +0800 | "fn.lztyun.cn" | "GET /app-center/v1/service/list HTTP/1.1" | 200 | 997 | "-" | "Flutter/3.5.4" "125.121.52.66"
```

## 技术栈 🛠️

### 后端
- Node.js
- Express
- Multer (文件上传)

### 前端
- React
- Recharts (图表库)
- Axios (HTTP 客户端)

## 快速开始 🚀

### 1. 安装依赖

```bash
# 安装所有依赖（服务器和客户端）
npm run install-all
```

或者分别安装：

```bash
# 安装服务器依赖
npm install

# 安装客户端依赖
cd client
npm install
cd ..
```

### 2. 启动应用

#### 方式一：开发模式（推荐）

同时启动前后端服务，适合开发和调试：

```bash
npm run dev
```

**启动后你会看到：**
- ✅ `[0] 服务器运行在端口 3001` - 后端服务启动成功
- ✅ `[1] Compiled with warnings` - 前端编译完成（可能有警告但不影响使用）
- ✅ 浏览器自动打开 http://localhost:3000

**常见警告说明：**
- ESLint 警告：代码质量提示，不影响功能
- Deprecation 警告：依赖包的兼容性提示，可忽略
- 日志解析警告：某些日志格式不匹配，正常现象

#### 方式二：分别启动

在两个终端中分别启动前后端：

```bash
# 终端 1 - 启动后端服务器
npm run server

# 终端 2 - 启动前端开发服务器
npm run client
```

#### 方式三：生产模式（使用 PM2）

使用 PM2 进程管理器启动生产环境：

```bash
# 安装 PM2（如果未安装）
npm install -g pm2

# 启动应用
pm2 start config/ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs log-parser-app

# 停止应用
pm2 stop log-parser-app

# 重启应用
pm2 restart log-parser-app
```

### 3. 访问应用

启动成功后，在浏览器中访问：

- 🎨 **前端界面**: http://localhost:3000
- 🔌 **后端 API**: http://localhost:3001/api
- 📊 **默认日志解析**: http://localhost:3001/api/parse-default-log

### 4. 停止服务

- **开发模式**: 在终端按 `Ctrl + C`
- **PM2 模式**: 运行 `pm2 stop log-parser-app`

## 项目结构 📁

```
safeline-log-parser-app/
├── server/                 # 后端代码
│   ├── index.js           # Express 服务器
│   ├── logParser.js       # 日志解析逻辑
│   └── logAnalyzer.js     # 日志分析逻辑
├── client/                # 前端代码
│   ├── public/            # 静态资源
│   └── src/
│       ├── components/    # React 组件
│       │   ├── Dashboard.js      # 数据统计面板
│       │   ├── LogTable.js       # 日志表格
│       │   └── FileUpload.js     # 文件上传
│       ├── hooks/         # 自定义 Hooks
│       ├── App.js         # 主应用组件
│       └── index.js       # 入口文件
├── config/                # 配置文件
│   ├── ecosystem.config.js  # PM2 配置
│   ├── nginx.conf           # Nginx 配置
│   └── README.md            # 配置说明
├── scripts/               # 脚本工具
│   ├── deploy.sh            # 部署脚本
│   ├── update.sh            # 更新脚本
│   ├── cleanup.sh           # 清理脚本
│   ├── package.sh           # 打包脚本
│   ├── test-parser.js       # 解析器测试
│   ├── test-large-file-api.sh  # 大文件 API 测试
│   └── README.md            # 脚本说明
├── docs/                  # 文档目录
│   ├── INDEX.md             # 文档索引
│   ├── USAGE.md             # 使用指南
│   ├── DEPLOY.md            # 部署文档
│   ├── QUICK_DEPLOY.md      # 快速部署
│   ├── FILTERS_QUICK_GUIDE.md  # 过滤器指南
│   ├── HISTORY_FEATURE.md      # 历史功能说明
│   └── LARGE_FILE_USAGE_GUIDE.md  # 大文件使用指南
├── logs/                  # 日志文件
├── uploads/               # 上传文件临时目录
├── Dockerfile             # Docker 构建文件
├── docker-compose.yml     # Docker Compose 配置
├── package.json          # 项目配置
└── README.md             # 项目说明（本文件）
```

## API 接口 🔌

### POST /api/parse-log
上传并解析日志文件

**请求：**
- Method: POST
- Content-Type: multipart/form-data
- Body: logFile (文件)

**响应：**
```json
{
  "logs": [...],
  "statistics": {...}
}
```

### GET /api/parse-default-log
解析项目中的默认 log.txt 文件

**响应：**
```json
{
  "logs": [...],
  "statistics": {...}
}
```

## 统计指标 📈

应用提供以下统计信息：

- **总请求数**: 日志文件中的总请求次数
- **唯一 IP**: 不同客户端 IP 的数量
- **错误率**: 4xx 和 5xx 状态码的比例
- **平均响应大小**: 响应体的平均大小
- **状态码分布**: 各状态码的占比（饼图）
- **请求方法分布**: GET、POST 等方法的使用情况（柱状图）
- **Top 10 访问路径**: 最常访问的 URL（柱状图）
- **Top 10 客户端 IP**: 请求最多的客户端（柱状图）

## 日志详情功能 🔍

### 筛选条件
- **全文搜索**: 支持搜索路径、IP 地址、请求方法、域名
- **状态码过滤**: 快速筛选成功、重定向、错误请求
- **请求方法过滤**: 按 HTTP 方法（GET、POST 等）筛选
- **日期范围**: 指定开始和结束日期，精确定位时间段

### 排序方式
- **时间排序**: 查看最新或最早的请求
- **大小排序**: 找出最大或最小的响应
- **状态码排序**: 按状态码数值排序

### 时间显示
智能时间格式，自动根据距离显示：
- 实时: "刚刚"（10秒内）
- 近期: "5分钟前"、"2小时前"
- 昨天: "昨天 14:30"
- 历史: "2026-03-04 09:53:59"

### 使用场景示例
```
场景 1: 查找昨天的所有 404 错误
- 日期范围: 选择昨天
- 状态码: 4xx 客户端错误
- 排序: 时间降序

场景 2: 分析特定 API 的使用情况
- 搜索: /api/users
- 方法: GET
- 排序: 时间升序

场景 3: 找出最大的响应
- 排序: 大小降序
- 查看顶部结果
```

## 生产部署 🚀

### 构建前端

```bash
npm run build
```

### 启动生产服务器

```bash
NODE_ENV=production npm run server
```

应用将在 http://localhost:3001 上运行，并提供构建后的 React 应用。

## 目录说明 📂

### 📚 docs/ - 文档目录
包含所有项目文档，包括使用指南、部署文档、功能说明等。查看 [docs/INDEX.md](./docs/INDEX.md) 获取完整文档列表。

### 🔧 config/ - 配置目录
存放 PM2、Nginx 等配置文件。查看 [config/README.md](./config/README.md) 了解各配置文件的用途。

### 📜 scripts/ - 脚本目录
包含部署、测试、维护等各类脚本工具。查看 [scripts/README.md](./scripts/README.md) 了解各脚本的使用方法。

### 📝 logs/ - 日志目录
存放应用运行日志和测试日志文件。该目录下的 `.log` 和 `.txt` 文件会被 git 忽略。

## 开发说明 💻

### 添加新功能

1. **后端**: 在 `server/` 目录添加新的路由和逻辑
2. **前端**: 在 `client/src/components/` 添加新组件
3. **解析逻辑**: 修改 `server/logParser.js` 以支持新的日志格式

### 自定义日志格式

修改 `server/logParser.js` 中的 `parseLine` 方法来适配您的日志格式。

### 性能优化

- 前端使用 `React.useMemo` 优化过滤和排序性能
- 分页显示避免一次性渲染大量数据
- 后端流式处理大文件（可进一步优化）

## 最近更新 🆕

### v1.2.0 (2026-03-05)
- ✅ **时间选择器优化** - 新增6个快捷日期按钮（今天、昨天、最近7/30天、本月、上月）
- ✅ **列表快速筛选** - 表格中直接点击域名、IP、方法、状态码即可筛选
- ✅ **详情页快速筛选** - 详情页也支持点击字段快速筛选
- ✅ **视觉优化** - 可点击单元格添加 🔍 图标和丰富的悬停效果
- ✅ **界面美化** - 渐变背景、圆角设计、现代化交互
- ✅ 完善文档体系 - 新增启动指南和功能说明文档
- ✅ 项目结构优化 - 整理脚本、配置、文档到独立目录
- ✅ 新增快速启动脚本 - 一键启动开发和生产环境

### v1.1.0 (2026-03-04)
- ✅ 添加友好的时间格式显示
- ✅ 新增日期范围筛选
- ✅ 新增请求方法过滤
- ✅ 新增多维度排序（时间、大小、状态码）
- ✅ 优化搜索功能，支持域名搜索
- ✅ 改进 UI/UX，添加 Emoji 图标
- ✅ 性能优化，使用 React Hooks

### v1.0.0 (2026-03-04)
- ✅ 基础日志解析功能
- ✅ 文件上传和路径指定
- ✅ 数据统计和可视化
- ✅ 响应式设计

## 故障排除 🔧

### 端口被占用

如果 3000 或 3001 端口被占用，可以修改：
- 后端端口: 修改 `server/index.js` 中的 `PORT` 变量
- 前端端口: 在 `client/` 目录创建 `.env` 文件，添加 `PORT=3002`

### 文件上传失败

确保 `uploads/` 目录存在且有写入权限：

```bash
mkdir uploads
chmod 755 uploads
```

## 许可证 📄

MIT License

## 贡献 🤝

欢迎提交 Issue 和 Pull Request！

---

Made with ❤️ for log analysis
