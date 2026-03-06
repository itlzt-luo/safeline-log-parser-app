# 脚本目录

本目录包含项目的各种维护和测试脚本。

## 📜 脚本列表

### 启动相关
- **`start.sh`** - 快速启动脚本（开发模式）
  - 自动检查并安装依赖
  - 启动开发环境
  - 适合日常开发使用

- **`start-pm2.sh`** - PM2 启动脚本（生产模式）
  - 使用 PM2 进程管理器
  - 适合生产环境
  - 支持自动重启和监控

### 部署相关
- **`deploy.sh`** - 完整部署脚本
  - 用于部署应用到生产环境
  - 包含构建、打包和启动流程

- **`package.sh`** - 打包脚本
  - 用于打包应用程序
  - 生成可分发的包

### 维护相关
- **`update.sh`** - 更新脚本
  - 用于更新应用到最新版本
  - 包含依赖更新和重启流程

- **`cleanup.sh`** - 清理脚本
  - 用于清理临时文件、日志和缓存
  - 释放磁盘空间

### 测试相关
- **`test-parser.js`** - 日志解析器测试
  - 测试日志解析功能
  - 验证解析器的正确性

- **`test-large-file-api.sh`** - 大文件 API 测试
  - 测试大文件上传和处理功能
  - 性能测试和压力测试

## 🚀 使用方法

所有脚本都需要在项目根目录下运行。例如：

```bash
# 快速启动（开发模式）
bash scripts/start.sh
# 或者直接运行
./scripts/start.sh

# 生产模式启动（PM2）
bash scripts/start-pm2.sh
# 或者直接运行
./scripts/start-pm2.sh

# 部署应用
bash scripts/deploy.sh

# 更新应用
bash scripts/update.sh

# 清理临时文件
bash scripts/cleanup.sh

# 测试日志解析器
node scripts/test-parser.js

# 测试大文件 API
bash scripts/test-large-file-api.sh
```

## ⚠️ 注意事项

- 部署和更新脚本可能需要 root 权限
- 测试脚本需要确保应用服务已启动
- 清理脚本会删除临时文件，请谨慎使用
