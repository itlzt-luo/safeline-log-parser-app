# 启动指南

本文档详细说明了 SafeLine 日志解析器的各种启动方式。

## 📋 前置条件

在启动应用前，请确保已安装：

- **Node.js**: v14.0.0 或更高版本
- **npm**: v6.0.0 或更高版本
- **PM2**（可选）: 用于生产环境部署

检查版本：
```bash
node --version
npm --version
```

## 🚀 启动方式

### 方式一：开发模式 🔧（推荐用于开发）

**适用场景**: 本地开发、调试、功能测试

**特点**:
- 同时启动前端和后端
- 支持热重载（代码修改自动更新）
- 详细的控制台日志输出
- 自动打开浏览器

**启动命令**:
```bash
cd /path/to/safeline-log-parser-app
npm run dev
```

**成功标志**:
```
[0] 服务器运行在端口 3001
[0] API 地址: http://localhost:3001/api
[1] Compiled with warnings.
[1] webpack compiled with 1 warning
```

浏览器会自动打开 http://localhost:3000

**停止服务**:
- 在终端按 `Ctrl + C`

---

### 方式二：分离模式 🔀（推荐用于调试）

**适用场景**: 需要分别查看前后端日志、独立重启某个服务

**特点**:
- 前后端独立运行
- 可分别查看日志
- 灵活控制

**启动步骤**:

#### 终端 1 - 启动后端
```bash
cd /path/to/safeline-log-parser-app
npm run server
```

看到以下输出表示成功：
```
服务器运行在端口 3001
API 地址: http://localhost:3001/api
```

#### 终端 2 - 启动前端
```bash
cd /path/to/safeline-log-parser-app
npm run client
```

看到以下输出表示成功：
```
Compiled successfully!
webpack compiled with 1 warning
```

**停止服务**:
- 在各自终端按 `Ctrl + C`

---

### 方式三：生产模式 🚀（推荐用于部署）

**适用场景**: 生产环境、长期运行、自动重启

**特点**:
- 使用 PM2 进程管理
- 自动重启（崩溃恢复）
- 日志管理
- 负载均衡（可配置多实例）
- 开机自启动

#### 安装 PM2
```bash
npm install -g pm2
```

#### 启动应用
```bash
cd /path/to/safeline-log-parser-app
pm2 start config/ecosystem.config.js
```

#### 常用 PM2 命令

**查看状态**:
```bash
pm2 status
# 或
pm2 list
```

**查看日志**:
```bash
# 实时查看所有日志
pm2 logs log-parser-app

# 查看错误日志
pm2 logs log-parser-app --err

# 查看最近 100 行
pm2 logs log-parser-app --lines 100
```

**重启应用**:
```bash
# 重启
pm2 restart log-parser-app

# 重新加载（零停机）
pm2 reload log-parser-app
```

**停止应用**:
```bash
pm2 stop log-parser-app
```

**删除应用**:
```bash
pm2 delete log-parser-app
```

**监控**:
```bash
pm2 monit
```

**保存 PM2 进程列表**:
```bash
pm2 save
```

**设置开机自启动**:
```bash
pm2 startup
# 按照提示执行返回的命令
pm2 save
```

---

### 方式四：Docker 容器 🐳（推荐用于隔离环境）

**适用场景**: 容器化部署、环境隔离、快速部署

**启动命令**:
```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

详细信息请参考 [DEPLOY.md](./DEPLOY.md)

---

## 🌐 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端界面 | http://localhost:3000 | Web 用户界面 |
| 后端 API | http://localhost:3001/api | RESTful API |
| 默认日志解析 | http://localhost:3001/api/parse-default-log | 解析默认日志 |
| 文件上传解析 | http://localhost:3001/api/parse-log | POST 上传文件 |

## ⚠️ 常见问题

### 1. 端口被占用

**错误信息**:
```
Error: listen EADDRINUSE: address already in use :::3001
```

**解决方案**:

**方案 A - 更换端口**:
```bash
# 修改后端端口
PORT=3002 npm run server

# 修改前端端口
# 在 client/ 目录创建 .env 文件
echo "PORT=3005" > client/.env
```

**方案 B - 释放端口**:
```bash
# 查找占用端口的进程
lsof -i :3001

# 终止进程（替换 PID）
kill -9 <PID>
```

### 2. 依赖安装失败

**解决方案**:
```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules client/node_modules

# 重新安装
npm run install-all
```

### 3. 前端编译警告

**常见警告**:
- ESLint 警告：代码规范提示，不影响功能
- Deprecation 警告：依赖包版本提示，可忽略
- Missing dependency 警告：React Hooks 依赖提示

**这些警告不影响应用运行**，但建议修复以提升代码质量。

### 4. PM2 应用无法启动

**检查步骤**:
```bash
# 查看详细错误
pm2 logs log-parser-app --err

# 检查配置文件
cat config/ecosystem.config.js

# 确保日志目录存在
mkdir -p logs
```

### 5. 无法访问应用

**检查清单**:
- [ ] 服务是否启动成功？运行 `pm2 status` 或查看终端输出
- [ ] 端口是否正确？确认 3000 和 3001 端口
- [ ] 防火墙是否阻止？临时关闭测试
- [ ] 浏览器缓存？尝试强制刷新 `Ctrl + Shift + R`

## 📊 启动状态检查

### 开发模式检查清单

✅ **后端启动成功**:
- 看到 `服务器运行在端口 3001`
- 访问 http://localhost:3001/api 返回 404（正常，因为没有根路由）
- 访问 http://localhost:3001/api/parse-default-log 返回 JSON 数据

✅ **前端启动成功**:
- 看到 `Compiled successfully!` 或 `Compiled with warnings.`
- 访问 http://localhost:3000 显示应用界面
- 可以上传日志文件或加载默认日志

### PM2 模式检查清单

✅ **服务运行正常**:
```bash
pm2 status
# 状态应该是 "online"，重启次数应该是 0 或很少
```

✅ **日志正常**:
```bash
pm2 logs log-parser-app --lines 20
# 应该看到服务器启动日志，没有错误
```

✅ **应用可访问**:
- 访问 http://localhost:3001 能看到前端页面（生产模式）

## 🎯 最佳实践

### 开发环境
1. 使用 **开发模式** (`npm run dev`)
2. 保持终端打开以查看实时日志
3. 代码修改后自动热重载
4. 出现错误立即停止并修复

### 生产环境
1. 使用 **PM2 模式** (`pm2 start config/ecosystem.config.js`)
2. 配置日志轮转避免日志文件过大
3. 设置开机自启动
4. 定期查看 PM2 监控
5. 配置 Nginx 反向代理（可选）

### 测试环境
1. 使用 **分离模式** 便于分别查看前后端日志
2. 可以独立重启某个服务
3. 便于调试和排查问题

## 📝 启动脚本示例

### 快速启动脚本
```bash
#!/bin/bash
# start.sh

echo "🚀 启动 SafeLine 日志解析器..."

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm run install-all
fi

# 启动应用
echo "✅ 启动开发服务器..."
npm run dev
```

### PM2 启动脚本
```bash
#!/bin/bash
# start-pm2.sh

echo "🚀 使用 PM2 启动应用..."

# 停止旧进程
pm2 stop log-parser-app 2>/dev/null

# 启动新进程
pm2 start config/ecosystem.config.js

# 显示状态
pm2 status

echo "✅ 应用已启动！"
echo "📊 查看日志: pm2 logs log-parser-app"
echo "🌐 访问地址: http://localhost:3001"
```

使用方法：
```bash
chmod +x start.sh start-pm2.sh
./start.sh  # 或 ./start-pm2.sh
```

## 🔗 相关文档

- [README.md](../README.md) - 项目主文档
- [DEPLOY.md](./DEPLOY.md) - 部署文档
- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - 快速部署指南
- [配置说明](../config/README.md) - PM2 和 Nginx 配置

---

更新时间：2026年3月5日
