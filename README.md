# 日志解析器 📊

一个功能强大的日志解析和可视化工具，可以帮助您快速分析服务器访问日志。

## 功能特点 ✨

- 📁 支持上传日志文件（.txt, .log 格式）
- 📄 可加载项目中的默认 log.txt 文件
- � 支持指定服务器文件路径加载
- �📊 实时数据统计和可视化
- 🔍 强大的日志搜索和过滤功能
  - 全文搜索（路径、IP、方法、域名）
  - 状态码过滤（2xx、3xx、4xx、5xx）
  - 请求方法过滤（GET、POST、PUT、DELETE 等）
  - 日期范围筛选
- 📈 多维度排序
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

#### 开发模式（同时启动前后端）

```bash
npm run dev
```

#### 或者分别启动

```bash
# 启动后端服务器（终端 1）
npm run server

# 启动前端开发服务器（终端 2）
npm run client
```

### 3. 访问应用

- 前端页面: http://localhost:3000
- 后端 API: http://localhost:3001

## 项目结构 📁

```
log-parser-app/
├── server/                 # 后端代码
│   ├── index.js           # Express 服务器
│   └── logParser.js       # 日志解析逻辑
├── client/                # 前端代码
│   ├── public/            # 静态资源
│   └── src/
│       ├── components/    # React 组件
│       │   ├── Dashboard.js      # 数据统计面板
│       │   ├── LogTable.js       # 日志表格
│       │   └── FileUpload.js     # 文件上传
│       ├── App.js         # 主应用组件
│       └── index.js       # 入口文件
├── uploads/               # 上传文件临时目录
├── log.txt               # 示例日志文件
├── package.json          # 项目配置
└── README.md             # 项目说明
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
