# 日志解析器 📊

一个功能强大的日志解析和可视化工具，可以帮助您快速分析服务器访问日志。

## 功能特点 ✨

- 📁 支持上传日志文件（.txt, .log 格式）
- 📄 可加载项目中的默认 log.txt 文件
- 🗂️ 支持指定服务器文件路径加载
- 🚀 **大日志文件支持**：基于 Node.js 流式处理，轻松应对 GB 级海量日志，拒绝内存溢出
- 🌍 **全本地 IP 归属地解析**：内置 `ip2region.xdb` 离线库，极速、准确解析请求来源城市，支持图表可视化
- 📊 实时数据统计和可视化
- 🔍 强大的日志搜索和过滤功能
  - 全文搜索（路径、IP、归属地、方法、域名）
  - 状态码过滤（2xx、3xx、4xx、5xx）
  - 请求方法过滤（GET、POST、PUT、DELETE 等）
  - 域名过滤
  - IP 地址及归属地过滤
  - 日期范围筛选
- ⚡ **快速筛选功能**
  - 表格中直接点击域名、IP、方法、状态码快速筛选
  - 详情页也支持点击筛选
  - 智能关联分析，无需手动操作筛选器
- 📅 **智能时间选择**
  - 6个快捷日期按钮（今天、昨天、最近7天、最近30天、本月、上月）
  - 优化的日期选择器界面，渐变背景设计
- 📈 多维度排序
  - 时间排序（升序/降序）
  - 大小排序（升序/降序）
  - 状态码排序（升序/降序）
- ⏰ 友好的时间格式显示（"刚刚"、"5分钟前"、"昨天 14:30"）
- 📈 多种图表展示（时间趋势图、来源地域柱状图、饼图等）
- 📋 详细的日志列表查看，包含完整请求及响应信息
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
- 本地二进制寻址 (ip2region xdb 快速检索 IP 归属地)

### 前端
- React
- Recharts (图表可视化)
- Axios (HTTP 客户端)
- Lucide-react (图标)

## 快速开始 🚀

### 1. 安装依赖

```bash
# 安装所有依赖（服务器和客户端）
npm run install-all
```

### 2. 初始化 IP 数据库 🌍

系统内置了获取最新 IP 地址归属地数据库的脚本，首次运行前或需要更新时执行：

```bash
# 下载/更新最新版本的 ip2region.xdb 库
npm run update-ip

# （可选）在 Linux/macOS 下，配置每月的自动更新定时任务
npm run setup-cron
```

### 3. 启动应用

#### 方式一：开发模式（推荐）

同时启动前后端服务，适合开发和调试：

```bash
npm run dev
```

**启动后你会看到：**
- ✅ 浏览器自动打开 http://localhost:3000
- ✅ `[0] 服务器运行在端口 3001` - 后端服务启动成功

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
```

### 4. 访问应用

启动成功后，在浏览器中访问：
- 🎨 **前端界面**: http://localhost:3000
- 🔌 **后端 API**: http://localhost:3001/api

## 项目结构 📁

```text
safeline-log-parser-app/
├── server/                 # 后端代码
│   ├── data/              # 存放本地数据，如 ip2region.xdb 数据库
│   ├── index.js           # Express 服务器入口
│   ├── logParser.js       # 单行日志解析核心
│   ├── logAnalyzer.js     # 基于流式处理的大文件分析核心
│   └── ipLookup.js        # IP 归属地高速查询模块
├── client/                # 前端 React 代码
├── config/                # 环境配置目录
├── scripts/               # 实用脚本
│   ├── update-ip-db.sh    # IP 归属地库更新脚本
│   └── setup-cron.sh      # 自动更新定时任务脚本
├── docs/                  # 详细技术文档及部署指南
└── package.json           # 项目清单
```

## 文档目录 (docs/) 📚

为了方便开发者快速了解项目的架构、部署和具体功能，`docs/` 目录下提供了详尽的说明文档。建议从 **[项目总览 (PROJECT_OVERVIEW.md)](docs/PROJECT_OVERVIEW.md)** 开始阅读。

### 🌟 核心指南
- **[项目总览](docs/PROJECT_OVERVIEW.md)** - 了解项目的整体架构、技术栈和核心功能。
- **[启动指南](docs/STARTUP_GUIDE.md)** / **[启动总结](docs/STARTUP_SUMMARY.md)** - 本地开发和运行的详细说明。
- **[使用指南](docs/USAGE.md)** - 应用的基本操作和功能介绍。

### 🚀 部署与测试
- **[完整部署](docs/DEPLOY.md)** - 生产环境下的详细部署教程（包括 Node、PM2 等）。
- **[快速部署](docs/QUICK_DEPLOY.md)** - 极简的快速部署流程。
- **[测试清单](docs/TESTING_CHECKLIST.md)** - 项目测试的完整检查点。

### 💡 进阶功能与优化说明
- **[大文件处理指南](docs/LARGE_FILE_USAGE_GUIDE.md)** & **[大文件优化说明](docs/LARGE_FILE_OPTIMIZATION.md)** - 介绍如何利用流式处理应对 GB 级海量日志。
- **[过滤器快速指南](docs/FILTERS_QUICK_GUIDE.md)** & **[快速筛选功能](docs/QUICK_FILTER_FEATURE.md)** - 详细说明强大的多维度过滤和交互式表格筛选功能。
- **[时间选择器优化](docs/DATE_PICKER_OPTIMIZATION.md)** - 关于时间范围筛选与快捷日期的实现说明。
- **[历史记录功能](docs/HISTORY_FEATURE.md)** - 分析历史记录保存与查看功能的实现细节。
- **[版本更新日志](docs/V1.2.0_RELEASE_NOTES.md)** - 查看历史重大版本更新内容。

## 最近更新 🆕

### v1.3.0 (2026-03-06)
- ✅ **大日志文件深度优化** - 引入流式读取（`readline`），解决几百MB乃至GB级大日志内存爆栈问题。
- ✅ **全本地IP归属地查询** - 集成 `ip2region.xdb` 纯本地高效率查询，并自动剔除冗余字段进行界面可视化。
- ✅ **归属地自动更新** - 增加自动更新 IP 库的 `update-ip` 脚本和 crontab 定时器配置脚本。
- ✅ **Top 地域可视化** - 数据大盘新增 "Top 10 来源地域" 的可视化柱状图。
- ✅ **多IP处理容错** - 针对带有代理转发、`X-Forwarded-For` 致使存在多个逗号分隔 IP 的情况做了专门容错处理。

### v1.2.0 (2026-03-05)
- ✅ **时间选择器优化** - 新增6个快捷日期按钮。
- ✅ **列表快速筛选** - 表格中直接点击域名、IP、方法、状态码即可筛选。

## 故障排除 🔧

### 端口被占用
如果 3000 或 3001 端口被占用，可以修改：
- 后端端口: 修改 `server/index.js` 中的 `PORT` 变量
- 前端端口: 在 `client/` 目录创建 `.env` 文件，添加 `PORT=3002`

### 文件上传失败 / 找不到日志
确保 `uploads/` 目录存在且有写入权限，或者检查对应绝对路径下是否存有日志文件。

## 许可证 📄

MIT License
